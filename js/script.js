
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
    
    // 使用 Kendo Validator 檢查必填 
    var validator = $("#book_detail_area").kendoValidator().data("kendoValidator");
    if (!validator.validate()) {
        alert("請輸入所有必填欄位！");
        return;
    }

    switch (state) {
        case "add":
            addBook();
            break;
        case "update":
            updateBook($("#book_id_d").val());
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
    // 計算新 ID
    var maxId = 0;
    if (bookDataFromLocalStorage.length > 0) {
        bookDataFromLocalStorage.forEach(function(item){
            if(item.BookId > maxId) maxId = item.BookId;
        });
    }
    var newId = maxId + 1;

    var classId = $("#book_class_d").data("kendoDropDownList").value();
    var classItem = classData.find(function(c){ return c.value == classId; });

    var book = {
        "BookId": newId,
        "BookName": $("#book_name_d").val(),
        "BookClassId": classId,
        "BookClassName": classItem ? classItem.text : "",
        "BookBoughtDate": kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(),"yyyy-MM-dd"),
        // 嚴格遵守預設值 
        "BookStatusId": "A",
        "BookStatusName": "可以借出",
        "BookKeeperId": "",
        "BookKeeperCname": "",
        "BookKeeperEname": "",
        "BookAuthor": $("#book_author_d").val(),
        "BookPublisher": $("#book_publisher_d").val(),
        "BookNote": $("#book_note_d").val()
    };

    bookDataFromLocalStorage.push(book);
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    
    loadBookData(); // 重新載入
    $("#book_grid").data("kendoGrid").dataSource.data(bookDataFromLocalStorage);
    $("#book_detail_area").data("kendoWindow").close();
}

 /**
  * 更新書籍
  * @param {} bookId 
  */
function updateBook(bookId){
    var book = bookDataFromLocalStorage.find(function(m){ return m.BookId == bookId; });
    if(!book) return;

    book.BookName = $("#book_name_d").val();
    book.BookClassId = $("#book_class_d").data("kendoDropDownList").value();
    
    var classItem = classData.find(function(c){ return c.value == book.BookClassId; });
    book.BookClassName = classItem ? classItem.text : "";
    
    book.BookBoughtDate = kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd");
    
    var statusId = $("#book_status_d").data("kendoDropDownList").value();
    var statusItem = bookStatusData.find(function(s){ return s.StatusId == statusId; });
    book.BookStatusId = statusId;
    book.BookStatusName = statusItem ? statusItem.StatusText : "";
    
    var keeperId = $("#book_keeper_d").data("kendoDropDownList").value();
    var keeperItem = memberData.find(function(m){ return m.UserId == keeperId; });
    book.BookKeeperId = keeperId;
    book.BookKeeperCname = keeperItem ? keeperItem.UserCname : "";
    book.BookKeeperEname = keeperItem ? keeperItem.UserEname : "";

    book.BookAuthor = $("#book_author_d").val();
    book.BookPublisher = $("#book_publisher_d").val();
    book.BookNote = $("#book_note_d").val();

    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    $("#book_grid").data("kendoGrid").dataSource.data(bookDataFromLocalStorage);
    
    // 若狀態為已借出(B)或已借出未領(C)，須新增借閱紀錄 
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
    
    var grid = getBooGrid();
    var filtersCondition = [];

    // 1. 書名：模糊查詢 (contains) 
    var bookName = $("#book_name_q").val();
    if(bookName){
        filtersCondition.push({ field: "BookName", operator: "contains", value: bookName });
    }

    // 2. 圖書類別：完全相等 (eq) 
    // 原本程式碼使用 contains，建議改為 eq
    var bookClassId = $("#book_class_q").data("kendoDropDownList").value();
    if(bookClassId){
        filtersCondition.push({ field: "BookClassId", operator: "eq", value: bookClassId });
    }

    // 3. 借閱人：完全相等 (eq) 
    var keeperId = $("#book_keeper_q").data("kendoDropDownList").value();
    if(keeperId){
        filtersCondition.push({ field: "BookKeeperId", operator: "eq", value: keeperId });
    }

    // 4. 借閱狀態：完全相等 (eq) 
    var statusId = $("#book_status_q").data("kendoDropDownList").value();
    if(statusId){
        filtersCondition.push({ field: "BookStatusId", operator: "eq", value: statusId });
    }

    // 執行篩選
    grid.dataSource.filter({
        logic: "and",
        filters: filtersCondition
    });
}


function deleteBook(e) {
    e.preventDefault(); // 避免點擊連結的預設行為
    
    var grid = $("#book_grid").data("kendoGrid");    
    var dataItem = grid.dataItem(e.target.closest("tr"));

    // [Fix] 1. 驗證：已借出書籍不可刪除 [Source 9]
    // 依照 code-data.js 定義：B=已借出, C=已借出(未領)
    if (dataItem.BookStatusId == "B" || dataItem.BookStatusId == "C") {
        alert("已借出書籍不可刪除！");
        return; // 終止程式，不執行刪除
    }

    // 增加確認視窗 (雖然文件沒寫，但這是良好的 UI 習慣)
    if (!confirm("確定要刪除 [" + dataItem.BookName + "] 嗎？")) {
        return;
    }

    // [Fix] 2. 移除 LocalStorage 資料 [Source 9]
    // 先找到該筆資料在陣列中的位置
    var index = bookDataFromLocalStorage.findIndex(function(item){
        return item.BookId == dataItem.BookId;
    });

    // 如果找得到，從陣列中移除並存檔
    if (index > -1) {
        bookDataFromLocalStorage.splice(index, 1);
        localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    }

    // [Fix] 3. 移除 Grid 該筆資料 [Source 9]
    grid.dataSource.remove(dataItem);    
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
    // 1. 清空所有查詢輸入項 
    $("#book_name_q").val("");
    $("#book_class_q").data("kendoDropDownList").value("");
    $("#book_keeper_q").data("kendoDropDownList").value("");
    $("#book_status_q").data("kendoDropDownList").value("");

    // 2. Grid 內容須同步 (清空篩選條件以顯示所有資料) 
    var grid = $("#book_grid").data("kendoGrid");
    grid.dataSource.filter({}); 
}

/**
 * 設定借閱狀態與借閱人關聯
 */
function setStatusKeepRelation() { 
    var statusId = $("#book_status_d").data("kendoDropDownList").value();
    var keeperDrop = $("#book_keeper_d").data("kendoDropDownList");
    var keeperContainer = $("#book_keeper_d").closest(".k-dropdown");

    // 依照 state 判斷顯示與否
    if (state === "add") {
        $("#book_status_d_col").hide();
        $("#book_keeper_d_col").hide();
    } else {
        $("#book_status_d_col").show();
        $("#book_keeper_d_col").show();

        // 邏輯判斷：B(已借出) 或 C(已借出未領) 需要借閱人 [cite: 12, 37]
        if (statusId == "B" || statusId == "C") {
            keeperDrop.enable(true);
            $("#book_keeper_d").attr("required", true); 
            keeperContainer.removeClass("k-state-disabled");
        } else {
            // A(可以借出) 或 U(不可借出) 不需要借閱人
            keeperDrop.value(""); 
            keeperDrop.enable(false);
            $("#book_keeper_d").removeAttr("required");
            keeperContainer.addClass("k-state-disabled");
        }
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