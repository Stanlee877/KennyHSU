
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

        // 啟用所有輸入欄位
        $("#book_name_d").prop("disabled", false);
        $("#book_author_d").prop("disabled", false);
        $("#book_publisher_d").prop("disabled", false);
        $("#book_note_d").prop("disabled", false);
        $("#book_bought_date_d").data("kendoDatePicker").enable(true);
        $("#book_class_d").data("kendoDropDownList").enable(true);
        
        // 清空表單
        clear();
        
        setStatusKeepRelation();

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
        // 先進行 Kendo 驗證，若未通過則中止儲存
        var validator = $("#book_detail_area").data("kendoValidator");
        if (validator) {
            if (!validator.validate()) {
                alert("請修正錯誤欄位後再儲存");
                return;
            }
        } else {
            // 若未初始化 validator，仍進行基本欄位檢查（書名為例）
            if (!$("#book_name_d").val()) {
                alert("書名不可空白");
                return;
            }
        }

        switch (state) {
            case "add":
                addBook();
                break;
            case "update":
                // 取得目前畫面上的 book id
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
    // 取得下拉選單選值與文字，更新圖片與顯示的類別名稱
    var ddl = $("#book_class_d").data("kendoDropDownList");
    if(!ddl){
        return;
    }
    var selectedValue = ddl.value();
    var selectedText = ddl.text();

    // 如果沒有選擇，還原為預設圖片與空白類別名稱
    if (!selectedValue || selectedValue === "") {
        $("#book_image_d").attr("src", "image/optional.jpg");
        $("#book_class_name_d").text("");
        return;
    }

    // 嘗試順序：1) image/{value}.jpg 2) image/class_{value}.jpg 3) optional.jpg
    var candidate1 = "image/" + selectedValue + ".jpg";
    var candidate2 = "image/class_" + selectedValue + ".jpg";

    // helper: try to load a URL, on success set image, on fail call fallback
    function tryLoad(url, onSuccess, onFail) {
        var img = new Image();
        img.onload = function () { onSuccess(url); };
        img.onerror = function () { onFail(); };
        img.src = url;
    }

    tryLoad(candidate1, function (url) {
        $("#book_image_d").attr("src", url);
    }, function () {
        tryLoad(candidate2, function (url2) {
            $("#book_image_d").attr("src", url2);
        }, function () {
            $("#book_image_d").attr("src", "image/optional.jpg");
        });
    });

    // 將選取的類別文字放到對應顯示欄位（如果存在）
    if ($("#book_class_name_d").length) {
        $("#book_class_name_d").text(selectedText);
    }
}


/**
 * 新增書籍
 */
function addBook() { 

    // 取得目前 grid 與表單欄位值
    var grid = $("#book_grid").data("kendoGrid");
    var name = $("#book_name_d").val();
    var classId = $("#book_class_d").data("kendoDropDownList").value();
    var boughtDate = kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd");
    // 新增時借閱人應為空
    var keeperId = "";

    // 產生新的唯一 BookId
    var newId = 1;
    if (bookDataFromLocalStorage && bookDataFromLocalStorage.length > 0) {
        var maxId = Math.max.apply(null, bookDataFromLocalStorage.map(function (m) { return Number(m.BookId) || 0; }));
        newId = maxId + 1;
    }

    // 取得類別與狀態名稱
    var className = "";
    var classItem = classData.find(function (c) { return c.value == classId; });
    if (classItem) className = classItem.text;

    var defaultStatusId = "A"; // 預設可借
    var statusItem = bookStatusData.find(function (s) { return s.StatusId == defaultStatusId; });
    var statusName = statusItem ? statusItem.StatusText : "";

    // 新增時借閱人應為空
    var book = {
        BookId: newId,
        BookName: name,
        BookClassId: classId,
        BookClassName: className,
        BookBoughtDate: boughtDate,
        BookStatusId: defaultStatusId,
        BookStatusName: statusName,
        BookKeeperId: "",
        BookKeeperCname: "",
        BookKeeperEname: "",
        BookAuthor: $("#book_author_d").val() || "",
        BookPublisher: $("#book_publisher_d").val() || "",
        BookNote: $("#book_note_d").val() || ""
    };

    // 將新書加入本地資料與 localStorage
    bookDataFromLocalStorage.push(book);
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));

    // 更新 grid 資料來源
    if (grid && grid.dataSource) {
        grid.dataSource.data(bookDataFromLocalStorage);
    }

    // 關閉視窗並清除表單
    $("#book_detail_area").data("kendoWindow").close();
    clear();
 }

 /**
  * 更新書籍
  * @param {} bookId 
  */
function updateBook(bookId){
    // 取得欲更新之書籍
    var book = bookDataFromLocalStorage.find(function (m) { return m.BookId == bookId; });
    if (!book) {
        alert("找不到要更新的書籍");
        return;
    }

    // 取得狀態變更前的狀態
    var oldStatusId = book.BookStatusId;
    var oldKeeperId = book.BookKeeperId;

    // 更新欄位
    book.BookName = $("#book_name_d").val() || book.BookName;
    var ddlClass = $("#book_class_d").data("kendoDropDownList");
    book.BookClassId = ddlClass ? ddlClass.value() : $("#book_class_d").val();
    var classItem = classData.find(function (c) { return c.value == book.BookClassId; });
    book.BookClassName = classItem ? classItem.text : "";
    book.BookBoughtDate = kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd") || book.BookBoughtDate;

    var statusDdl = $("#book_status_d").data("kendoDropDownList");
    var bookStatusId = statusDdl ? statusDdl.value() : $("#book_status_d").val();
    book.BookStatusId = bookStatusId || book.BookStatusId;
    var statusItem = bookStatusData.find(function (s) { return s.StatusId == book.BookStatusId; });
    book.BookStatusName = statusItem ? statusItem.StatusText : book.BookStatusName;

    var keeperId = $("#book_keeper_d").data("kendoDropDownList").value() || "";
    book.BookKeeperId = keeperId;
    book.BookKeeperCname = keeperId ? (memberData.find(function (m) { return m.UserId == keeperId; }) || {}).UserCname || "" : "";
    book.BookKeeperEname = keeperId ? (memberData.find(function (m) { return m.UserId == keeperId; }) || {}).UserEname || "" : "";

    book.BookAuthor = $("#book_author_d").val() || "";
    book.BookPublisher = $("#book_publisher_d").val() || "";
    book.BookNote = $("#book_note_d").val() || "";

    // 儲存到 localStorage 並更新 grid
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    var grid = $("#book_grid").data("kendoGrid");
    if (grid && grid.dataSource) {
        grid.dataSource.data(bookDataFromLocalStorage);
    }

    // 若狀態變更為已借出(B)或已借出(未領)(C)，且狀態有變更或借閱人有變更，則新增借閱紀錄
    if ((book.BookStatusId == "B" || book.BookStatusId == "C") && keeperId != "") {
        // 檢查狀態或借閱人是否有變更
        if (oldStatusId != book.BookStatusId || oldKeeperId != keeperId) {
            addBookLendRecord(bookId);
        }
    }

    $("#book_detail_area").data("kendoWindow").close();
    clear();
 }

 /**新增借閱紀錄 */
 function addBookLendRecord(bookIdParam) {  
    // 取得目前表單書籍 id 與借閱人
    var bookId = bookIdParam || $("#book_id_d").val();
    if (!bookId) {
        alert("找不到書籍編號，無法新增借閱紀錄");
        return;
    }

    var keeperId = $("#book_keeper_d").data("kendoDropDownList").value();
    if (!keeperId) {
        alert("請先選擇借閱人");
        return;
    }

    var keeper = memberData.find(function (m) { return m.UserId == keeperId; }) || {};
    var lendRecord = {
        BookId: Number(bookId),
        BookKeeperId: keeperId,
        BookKeeperCname: keeper.UserCname || "",
        BookKeeperEname: keeper.UserEname || "",
        LendDate: kendo.toString(new Date(), "yyyy-MM-dd")
    };

    // push 到 local 資料並儲存
    bookLendDataFromLocalStorage.push(lendRecord);
    localStorage.setItem("lendData", JSON.stringify(bookLendDataFromLocalStorage));
 }

/**
 * 查詢
 */
function queryBook(){
    
    var grid=getBooGrid();

    var bookName = $("#book_name_q").val() || "";
    var bookClassId = $("#book_class_q").data("kendoDropDownList").value() || "";
    var keeperId = $("#book_keeper_q").data("kendoDropDownList").value() || "";
    var statusId = $("#book_status_q").data("kendoDropDownList").value() || "";

    var filtersCondition=[];
    
    // 書名模糊查詢
    if(bookName != ""){
        filtersCondition.push({ field: "BookName", operator: "contains", value: bookName });
    }
    
    // 圖書類別完全相等
    if(bookClassId != ""){
        filtersCondition.push({ field: "BookClassId", operator: "eq", value: bookClassId });
    }
    
    // 借閱人完全相等
    if(keeperId != ""){
        filtersCondition.push({ field: "BookKeeperId", operator: "eq", value: keeperId });
    }
    
    // 借閱狀態完全相等
    if(statusId != ""){
        filtersCondition.push({ field: "BookStatusId", operator: "eq", value: statusId });
    }

    if(filtersCondition.length > 0){
        grid.dataSource.filter({
            logic: "and",
            filters: filtersCondition
        });
    } else {
        grid.dataSource.filter([]);
    }
}

function deleteBook(e) {
    e.preventDefault();
    
    var grid = $("#book_grid").data("kendoGrid");    
    var row = grid.dataItem(e.target.closest("tr"));
    
    // 檢查是否已借出（B-已借出、C-已借出(未領)）
    if(row.BookStatusId == "B" || row.BookStatusId == "C"){
        alert("已借出書籍不可刪除");
        return;
    }

    // 從 grid 移除
    grid.dataSource.remove(row);
    
    // 從 localStorage 移除
    var bookIndex = bookDataFromLocalStorage.findIndex(function(b) { return b.BookId == row.BookId; });
    if(bookIndex > -1){
        bookDataFromLocalStorage.splice(bookIndex, 1);
        localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));
    }
    
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
    $("#book_status_d_col").css("display", "");
    $("#book_keeper_d_col").css("display", "");
    
    // 啟用所有輸入欄位
    $("#book_name_d").prop("disabled", false);
    $("#book_author_d").prop("disabled", false);
    $("#book_publisher_d").prop("disabled", false);
    $("#book_note_d").prop("disabled", false);
    $("#book_bought_date_d").data("kendoDatePicker").enable(true);
    $("#book_class_d").data("kendoDropDownList").enable(true);
    $("#book_status_d").data("kendoDropDownList").enable(true);

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
function showBookForDetail(e,bookId) {
    e.preventDefault();
    state = "";
    $("#btn-save").css("display", "none");
    $("#book_status_d_col").css("display", "");
    $("#book_keeper_d_col").css("display", "");
    $("#book_detail_area").data("kendoWindow").title("書籍明細");
    
    // 禁用所有輸入欄位
    $("#book_name_d").prop("disabled", true);
    $("#book_author_d").prop("disabled", true);
    $("#book_publisher_d").prop("disabled", true);
    $("#book_note_d").prop("disabled", true);
    $("#book_bought_date_d").data("kendoDatePicker").enable(false);
    $("#book_class_d").data("kendoDropDownList").enable(false);
    $("#book_status_d").data("kendoDropDownList").enable(false);
    $("#book_keeper_d").data("kendoDropDownList").enable(false);
    
    bindBook(bookId);
    setStatusKeepRelation();
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
    $("#book_note_d").val(book.BookNote || "");

    // 設定類別下拉
    var ddlClass = $("#book_class_d").data("kendoDropDownList");
    if (ddlClass) ddlClass.value(book.BookClassId);

    // 設定購買日期
    if (book.BookBoughtDate) {
        var dp = $("#book_bought_date_d").data("kendoDatePicker");
        if (dp) dp.value(new Date(book.BookBoughtDate));
    }

    // 設定狀態與借閱人
    var ddlStatus = $("#book_status_d").data("kendoDropDownList");
    if (ddlStatus) ddlStatus.value(book.BookStatusId);

    var ddlKeeper = $("#book_keeper_d").data("kendoDropDownList");
    if (ddlKeeper) ddlKeeper.value(book.BookKeeperId || "");

    // 更新圖片
    if (book.BookClassId) {
        onChange();
    } else {
        $("#book_image_d").attr("src", "image/optional.jpg");
    }
}

function showBookLendRecord(e) {

    var grid = getBooGrid();
    var dataItem = grid.dataItem(e.target.closest("tr"));
    var bookId = dataItem.BookId;

    var bookLendRecordData = bookLendDataFromLocalStorage.filter(function (r) { return r.BookId == bookId; });

    $("#book_record_grid").data("kendoGrid").dataSource.data(bookLendRecordData);
    $("#book_record_area").data("kendoWindow").title(dataItem.BookName).open();

}

/**
 * 清畫面
 * @param {*} area 
 */
function clear(area) {
    // 清除查詢區與明細區常用欄位
    $("#book_name_q").val("");
    $("#book_class_q").data("kendoDropDownList").value("");
    $("#book_keeper_q").data("kendoDropDownList").value("");
    $("#book_status_q").data("kendoDropDownList").value("");

    // 清除明細欄位
    $("#book_id_d").val("");
    $("#book_name_d").val("");
    var ddlClass = $("#book_class_d").data("kendoDropDownList"); if (ddlClass) ddlClass.value("");
    var dp = $("#book_bought_date_d").data("kendoDatePicker"); if (dp) dp.value(new Date());
    var ddlStatus = $("#book_status_d").data("kendoDropDownList"); if (ddlStatus) ddlStatus.value("");
    var ddlKeeper = $("#book_keeper_d").data("kendoDropDownList"); if (ddlKeeper) ddlKeeper.value("");
    $("#book_author_d").val("");
    $("#book_publisher_d").val("");
    $("#book_note_d").val("");
    $("#book_image_d").attr("src", "image/optional.jpg");

}

/**
 * 設定借閱狀態與借閱人關聯
 */
function setStatusKeepRelation() { 
    switch (state) {
        case "add"://新增狀態
            $("#book_status_d_col").css("display","none");
            $("#book_keeper_d_col").css("display","none");
        
            $("#book_status_d").prop('required',false);
            $("#book_keeper_d").prop('required',false);
            break;
        case "update"://修改狀態
            $("#book_status_d_col").css("display","");
            $("#book_keeper_d_col").css("display","");
            $("#book_status_d").prop('required',true);

            var bookStatusId = $("#book_status_d").data("kendoDropDownList").value() || "";
            var ddlKeeper = $("#book_keeper_d").data("kendoDropDownList");
            var validator = $("#book_detail_area").data("kendoValidator");
            
            // 根據需求：A-可以借出、U-不可借出：非必填、Disable
            // B-已借出、C-已借出(未領)：必填、Enable
            if(bookStatusId == "A" || bookStatusId == "U"){
                // 非必填、Disable
                $("#book_keeper_d_label").removeClass("required");
                $("#book_keeper_d").prop('required', false);
                if(ddlKeeper){
                    ddlKeeper.enable(false);
                    ddlKeeper.value("");
                }
                if(validator){
                    validator.validateInput($("#book_keeper_d"));
                }
            } else if(bookStatusId == "B" || bookStatusId == "C"){
                // 必填、Enable
                $("#book_keeper_d_label").addClass("required");
                $("#book_keeper_d").prop('required', true);
                if(ddlKeeper){
                    ddlKeeper.enable(true);
                }
                if(validator){
                    validator.validateInput($("#book_keeper_d"));
                }
            }
            break;
        default:
            // 只讀模式（showBookForDetail）
            $("#book_status_d_col").css("display","");
            $("#book_keeper_d_col").css("display","");
            var ddlStatus = $("#book_status_d").data("kendoDropDownList");
            var ddlKeeper2 = $("#book_keeper_d").data("kendoDropDownList");
            if(ddlStatus) ddlStatus.enable(false);
            if(ddlKeeper2) ddlKeeper2.enable(false);
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
        value: new Date(),
        format: "yyyy/MM/dd"
    });

    // 初始化 Kendo Validator 用於書籍明細視窗
    $("#book_detail_area").kendoValidator();
}

/**
 * 取得畫面上的 BookGrid
 * @returns 
 */
function getBooGrid(){
    return $("#book_grid").data("kendoGrid");
}