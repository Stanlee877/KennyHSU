
var bookDataFromLocalStorage = [];
var bookLendDataFromLocalStorage =[];

var state="";

var stateOption={
    "add":"add",
    "update":"update"
}


$(function () {
    loadBookData();
    registerRegularComponent();

    //Kendo Window reference
    //初始化：Configuration
    //初始化後、在其他時間顛要控制 Kendo 物件：Methods、key data("kendoXXXX")
    //初始化時綁定 Kendo 的事件(Ex.當 Kendo Window 關閉時要做一些事情(Call function)：Events
    //https://www.telerik.com/kendo-jquery-ui/documentation/api/javascript/ui/window#configuration
    $("#book_detail_area").kendoWindow({
        width: "1200px",
        title: "新增書籍",
        visible: false,
        modal: true,
        actions: [
            "Close"
        ]
    }).data("kendoWindow").center();

    $("#book_record_area").kendoWindow({
        width: "700px",
        title: "借閱紀錄",
        visible: false,
        modal: true,
        actions: [
            "Close"
        ]
    }).data("kendoWindow").center();
    

    $("#btn_add_book").click(function (e) {
        e.preventDefault();
        state=stateOption.add;

        setStatusKeepRelation(state);

        $("#btn-save").css("display","");        
        $("#book_detail_area").data("kendoWindow").title("新增書籍");
        $("#book_detail_area").data("kendoWindow").open();
    });


    $("#btn_query").click(function (e) {
        e.preventDefault();
        queryBook();
    });

    $("#btn_clear").click(function (e) {
        e.preventDefault();

        clear();
        queryBook();
    });

$("#btn-save").click(function (e) {
        e.preventDefault();
        
        // TODO : 存檔前請作必填的檢查 (這是您截圖中的第1個 TODO)
        // 使用 Kendo Validator 進行驗證 (符合程式碼註解中的"優"級作法)
        var validator = $("#book_detail_area").kendoValidator().data("kendoValidator");
        
        if (!validator.validate()) {
            // 驗證失敗，顯示錯誤訊息 (Kendo 會自動顯示紅色錯誤提示，這裡可加一個 alert 作為雙重提示)
            alert("請檢查必填欄位是否皆已輸入！");
            return;
        }

        switch (state) {
            case "add":
                addBook();
                break;
            case "update":
                // 需取得當前編輯的 BookId，這裡我們從隱藏欄位取
                var bookId = $("#book_id_d").val(); 
                updateBook(bookId);
            break;
            default:
                break;
        }
        
    });

    $("#book_grid").kendoGrid({
        dataSource: {
            data: bookDataFromLocalStorage,
            schema: {
                model: {
                    id:"BookId",
                    fields: {
                        BookId: { type: "int" },
                        BookClassName: { type: "string" },
                        BookName: { type: "string" },
                        BookBoughtDate: { type: "string" },
                        BookStatusName: { type: "string" },
                        BookKeeperCname: { type: "string" }
                    }
                }
            },
            pageSize: 20,
        },
        height: 550,
        sortable: true,
        pageable: {
            input: true,
            numeric: false
        },
        columns: [
            { field: "BookId", title: "書籍編號", width: "10%" },
            { field: "BookClassName", title: "圖書類別", width: "15%" },
            { field: "BookName", title: "書名", width: "30%" ,
              template: "<a style='cursor:pointer; color:blue' onclick='showBookForDetail(event,#:BookId #)'>#: BookName #</a>"
            },
            { field: "BookBoughtDate", title: "購書日期", width: "15%" },
            { field: "BookStatusName", title: "借閱狀態", width: "15%" },
            { field: "BookKeeperCname", title: "借閱人", width: "15%" },
            { command: { text: "借閱紀錄", click: showBookLendRecord }, title: " ", width: "120px" },
            { command: { text: "修改", click: showBookForUpdate }, title: " ", width: "100px" },
            { command: { text: "刪除", click: deleteBook }, title: " ", width: "100px" }
        ]

    });

    $("#book_record_grid").kendoGrid({
        dataSource: {
            data: [],
            schema: {
                model: {
                    fields: {
                        LendDate: { type: "string" },
                        BookKeeperId: { type: "string" },
                        BookKeeperEname: { type: "string" },
                        BookKeeperCname: { type: "string" }
                    }
                }
            },
            pageSize: 20,
        },
        height: 250,
        sortable: true,
        pageable: {
            input: true,
            numeric: false
        },
        columns: [
            { field: "LendDate", title: "借閱日期", width: "10%" },
            { field: "BookKeeperId", title: "借閱人編號", width: "10%" },
            { field: "BookKeeperEname", title: "借閱人英文姓名", width: "15%" },
            { field: "BookKeeperCname", title: "借閱人中文姓名", width: "15%" },
        ]
    });

})

/**
 * 初始化 localStorage 資料
 * 將 data 內的 book-data.js..bookData；book-lend-record.js..lendData 寫入 localStorage 作為"資料庫"使用
 */
function loadBookData() {
    bookDataFromLocalStorage = JSON.parse(localStorage.getItem("bookData"));
    if (bookDataFromLocalStorage == null) {
        bookDataFromLocalStorage = bookData;
        localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    }

    bookLendDataFromLocalStorage = JSON.parse(localStorage.getItem("lendData"));
    if (bookLendDataFromLocalStorage == null) {
        bookLendDataFromLocalStorage = lendData;
        localStorage.setItem("lendData", JSON.stringify(bookLendDataFromLocalStorage));
    }
}

function onChange() {
    //TODO : 請完成遺漏的邏輯
    var selectedValue = $("#book_class_d").data("kendoDropDownList").value();
    
    if(selectedValue === ""){
        $("#book_image").attr("src", "image/optional.jpg");
    }else{
       $("#book_image").attr("src", "image/" + selectedValue + ".jpg");
    }
}


/**
 * 新增書籍
 */
function addBook() { 
    //TODO：請完成新增書籍的相關功能
    // 取得目前最大 ID 並 +1
    var maxId = 0;
    if(bookDataFromLocalStorage.length > 0){
        bookDataFromLocalStorage.forEach(function(item){
            if(item.BookId > maxId) maxId = item.BookId;
        });
    }
    var newId = maxId + 1;

    // 取得類別名稱
    var classId = $("#book_class_d").data("kendoDropDownList").value();
    var className = "";
    var classItem = classData.find(function(c){ return c.value == classId; });
    if(classItem) className = classItem.text;

    var book = {
        "BookId": newId,
        "BookName": $("#book_name_d").val(),
        "BookClassId": classId,
        "BookClassName": className,
        "BookBoughtDate": kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(),"yyyy-MM-dd"),
        "BookStatusId": "A",
        "BookStatusName": "可以借出", // 預設狀態
        "BookKeeperId": "",
        "BookKeeperCname": "",
        "BookKeeperEname": "",
        "BookAuthor": $("#book_author_d").val(),
        "BookPublisher": $("#book_publisher_d").val(),
        "BookNote": $("#book_note_d").val()
    }

    // 存入 LocalStorage
    bookDataFromLocalStorage.push(book);
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));

    // 更新 Grid
    var grid = $("#book_grid").data("kendoGrid");
    grid.dataSource.data(bookDataFromLocalStorage);

    //關閉 Window
    $("#book_detail_area").data("kendoWindow").close();
 }

 /**
  * 更新書籍
  * @param {} bookId 
  */
function updateBook(bookId){
    //TODO：請完成更新書籍的相關功能
    // 注意：這裡假設原程式碼的 find 語法是被允許的 (ES6)，若需嚴格 ES5 請改用 for loop
    var book = bookDataFromLocalStorage.find(function(m){ return m.BookId == bookId; });

    book.BookName = $("#book_name_d").val();
    book.BookClassId = $("#book_class_d").data("kendoDropDownList").value();
    
    // 更新類別名稱
    var classItem = classData.find(function(c){ return c.value == book.BookClassId; });
    book.BookClassName = classItem ? classItem.text : "";

    book.BookBoughtDate = kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd");
    
    // 更新狀態與借閱人
    var statusId = $("#book_status_d").data("kendoDropDownList").value();
    var statusItem = bookStatusData.find(function(s){ return s.StatusId == statusId; });
    book.BookStatusId = statusId;
    book.BookStatusName = statusItem ? statusItem.StatusText : "";
    
    var bookKeeperId = $("#book_keeper_d").data("kendoDropDownList").value();
    var bookKeeperCname = "";
    var bookKeeperEname = "";
    
    if(bookKeeperId){
        var member = memberData.find(function(m){ return m.UserId == bookKeeperId; });
        if(member){
            bookKeeperCname = member.UserCname;
            bookKeeperEname = member.UserEname;
        }
    }

    book.BookKeeperId = bookKeeperId;
    book.BookKeeperCname = bookKeeperCname;
    book.BookKeeperEname = bookKeeperEname;

    book.BookAuthor = $("#book_author_d").val();
    book.BookPublisher = $("#book_publisher_d").val();
    book.BookNote = $("#book_note_d").val(); // 注意：原本程式碼寫 BookNote=""; 這裡修正為取值

    // 存回 LocalStorage
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));

    var grid = $("#book_grid").data("kendoGrid");
    // grid.dataSource.pushUpdate(book); // pushUpdate 有時不穩定，建議重刷 data
    grid.dataSource.data(bookDataFromLocalStorage);
    
    // 若狀態改變為借出，需新增紀錄
    if(statusId == "B" || statusId == "C"){
        addBookLendRecord(book);
    }
    
    $("#book_detail_area").data("kendoWindow").close();

    clear();
 }

 /**新增借閱紀錄 */
 function addBookLendRecord() {  
    //TODO：請完成新增借閱紀錄相關功能
    var record = {
        "BookId": book.BookId,
        "BookKeeperId": book.BookKeeperId,
        "BookKeeperCname": book.BookKeeperCname,
        "BookKeeperEname": book.BookKeeperEname,
        "LendDate": kendo.toString(new Date(), "yyyy-MM-dd")
    };
    
    bookLendDataFromLocalStorage.push(record);
    localStorage.setItem("lendData", JSON.stringify(bookLendDataFromLocalStorage));
 }

 /**
  * 查詢
  */
function queryBook(){
    
    var grid=getBooGrid();

    var bookClassId=$("#book_class_q").data("kendoDropDownList").value() ?? "";


    var filtersCondition=[];
    if(bookClassId!=""){
        filtersCondition.push({ field: "BookClassId", operator: "contains", value: bookClassId });
    }

    grid.dataSource.filter({
        logic: "and",
        filters:filtersCondition
    });
}

function deleteBook(e) {
    
    var grid = $("#book_grid").data("kendoGrid");    
    var row = grid.dataItem(e.target.closest("tr"));

    grid.dataSource.remove(row);    
    alert("刪除成功");

}


/**
 * 顯示圖書編輯畫面
 * @param {} e 
 */
function showBookForUpdate(e) {
    e.preventDefault();

    state=stateOption.update;
    $("#book_detail_area").data("kendoWindow").title("修改書籍");
    $("#btn-save").css("display","");

    var grid = getBooGrid();
    var bookId = grid.dataItem(e.target.closest("tr")).BookId;

    bindBook(bookId);
    
    setStatusKeepRelation();
    $("#book_detail_area").data("kendoWindow").open();
}

/**
 * 顯示圖書明細畫面
 * @param {} e 
 * @param {*} bookId 
 */
function showBookForDetail(e, bookId) {
    //TODO : 請補齊未完成的功能
    state = ""; // 清空狀態，避免觸發驗證或修改邏輯
    $("#book_detail_area").data("kendoWindow").title("書籍明細");
    
    bindBook(bookId);
    
    // 設定所有欄位 Disable
    $(".k-textbox, .k-dropdown, .k-datepicker").addClass("k-state-disabled");
    $("input, textarea").prop("disabled", true);
    
    // Kendo 元件 Disable
    $("#book_class_d").data("kendoDropDownList").enable(false);
    $("#book_status_d").data("kendoDropDownList").enable(false);
    $("#book_keeper_d").data("kendoDropDownList").enable(false);
    $("#book_bought_date_d").data("kendoDatePicker").enable(false);
    
    // 隱藏存檔按鈕
    $("#btn-save").css("display", "none");
    
    $("#book_detail_area").data("kendoWindow").open();
}

/**
 * 繫結圖書資料
 * @param {*} bookId 
 */
function bindBook(bookId){
    var book = bookDataFromLocalStorage.find(m => m.BookId == bookId);
    $("#book_id_d").val(bookId);
    $("#book_name_d").val(book.BookName);
    $("#book_author_d").val(book.BookAuthor);
    $("#book_publisher_d").val(book.BookPublisher);
    //TODO : 完成尚未完成的程式碼
    $("#book_class_d").data("kendoDropDownList").value(book.BookClassId);
    $("#book_status_d").data("kendoDropDownList").value(book.BookStatusId);
    $("#book_keeper_d").data("kendoDropDownList").value(book.BookKeeperId);

    // 7. 設定 DatePicker 與 TextArea 並觸發圖片更新
    $("#book_bought_date_d").data("kendoDatePicker").value(book.BookBoughtDate);
    $("#book_note_d").val(book.BookNote);
    
    // 手動觸發 onChange 以更新圖片
    onChange();
}

function showBookLendRecord(e) {
    e.preventDefault();

    //TODO : 請補齊未完成的功能
    var grid = getBooGrid();
    var dataItem = grid.dataItem(e.target.closest("tr"));
    
    // 從 localStorage 資料過濾出該書的紀錄
    var bookLendRecordData = bookLendDataFromLocalStorage.filter(function(item){
        return item.BookId == dataItem.BookId;
    });
    
    $("#book_record_grid").data("kendoGrid").dataSource.data(bookLendRecordData);
    $("#book_record_area").data("kendoWindow").title("借閱紀錄 - " + dataItem.BookName); // 設定 Title
    $("#book_record_area").data("kendoWindow").open();
}

/**
 * 清畫面
 * @param {*} area 
 */
function clear(area) {
    //TODO : 請補齊未完成的功能
    $("#book_name_q").val("");
    // 清除下拉選單
    $("#book_class_q").data("kendoDropDownList").select(0);
    $("#book_keeper_q").data("kendoDropDownList").select(0);
    $("#book_status_q").data("kendoDropDownList").select(0);
    
    // 重新整理 Grid (顯示全部資料)
    var grid = getBooGrid();
    grid.dataSource.filter({});

}

/**
 * 設定借閱狀態與借閱人關聯
 */
function setStatusKeepRelation() { 
    //TODO : 請補齊借閱人與借閱狀態相關邏輯
    var statusId = $("#book_status_d").data("kendoDropDownList").value();
    var keeperDrop = $("#book_keeper_d").data("kendoDropDownList");

    switch (state) {
        case "add"://新增狀態
            $("#book_status_d_col").css("display","none");
            $("#book_keeper_d_col").css("display","none");
            break; 
            
        case "update"://修改狀態
            $("#book_status_d_col").css("display","block"); // 確保顯示
            $("#book_keeper_d_col").css("display","block");

            // A:可借出, C:不可借出 (借閱人 Disable, 非必填)
            if(statusId == "A" || statusId == "U"){ 
                 // 注意：根據文件 A=可以借出, U=不可借出(Source 30寫不可借出是U, Source 12寫U是已借出未領?)
                 // 根據 Source 12: A(可借出), U(已借出未領), B(已借出), C(不可借出)
                 // Source 12 說: A, C -> Disable. B, U -> Enable.
            }
            
            // 根據 Source 12 邏輯重新實作
            if (statusId === "B" || statusId === "C") { // 假設 C 是已借出(未領)對應文件說明，雖然文件代碼對應有點混亂，我們依循 "需要借閱人" 的情境
                // 根據 source 12: B(已借出), U(已借出未領) -> Enable, 必填
                // 假設 C 在 source 35 是已借出(未領)， source 12 寫 U 是已借出(未領)。依照 code-data.js: U=不可借出, C=已借出(未領)
                // 正確邏輯應依照 code-data.js (Source 37):
                // A:可以借出, B:已借出, U:不可借出, C:已借出(未領)
                
                // 邏輯: B(已借出) 與 C(已借出未領) 需要借閱人
               if(statusId === "B" || statusId === "C"){
                   keeperDrop.enable(true);
                   $("#book_keeper_d").prop("required", true);
                   $("#book_keeper_d").closest(".k-dropdown").removeClass("k-state-disabled");
               } else {
                   // A(可以借出) 與 U(不可借出) 不需要借閱人
                   keeperDrop.value("");
                   keeperDrop.enable(false);
                   $("#book_keeper_d").prop("required", false);
               }
            } else {
                 // Fallback logic inside the provided switch structure
                 if(statusId == "B" || statusId == "C"){ // B & C need keeper
                    keeperDrop.enable(true);
                 } else {
                    keeperDrop.enable(false);
                    keeperDrop.value("");
                 }
            }
            break;
    }
 }

 /**
  * 生成畫面所需的 Kendo 控制項
  */
function registerRegularComponent(){
    $("#book_class_q").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: classData,
        optionLabel: "請選擇",
        index: 0
    });

    $("#book_class_d").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: classData,
        optionLabel: "請選擇",
        index: 0,
        change: onChange
    });

    $("#book_keeper_q").kendoDropDownList({
        dataTextField: "UserCname",
        dataValueField: "UserId",
        dataSource: memberData,
        optionLabel: "請選擇",
        index: 0
    });

    $("#book_keeper_d").kendoDropDownList({
        dataTextField: "UserCname",
        dataValueField: "UserId",
        dataSource: memberData,
        optionLabel: "請選擇",
        index: 0
    });

    $("#book_status_q").kendoDropDownList({
        dataTextField: "StatusText",
        dataValueField: "StatusId",
        dataSource: bookStatusData,
        optionLabel: "請選擇",
        index: 0
    });

    $("#book_status_d").kendoDropDownList({
        dataTextField: "StatusText",
        dataValueField: "StatusId",
        dataSource: bookStatusData,
        optionLabel: "請選擇",
        change:setStatusKeepRelation,
        index: 0
    });


    $("#book_bought_date_d").kendoDatePicker({
        value: new Date()
    });
}

/**
 * 取得畫面上的 BookGrid
 * @returns 
 */
function getBooGrid(){
    return $("#book_grid").data("kendoGrid");
}