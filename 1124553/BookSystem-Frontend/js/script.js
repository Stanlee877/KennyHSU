
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
        
        // 使用 Kendo Validator 進行必填檢查
        if (!$("#book_detail_area").data("kendoValidator")) {
            $("#book_detail_area").kendoValidator();
        }
        var validator = $("#book_detail_area").data("kendoValidator");
        if (!validator.validate()) {
            alert("請填寫必填欄位");
            return;
        }
        switch (state) {
            case "add":
                addBook();
                break;
            case "update":
                updateBook('9999');
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
    // 更新封面圖片
    var ddl = $("#book_class_d").data("kendoDropDownList");
    var selectedValue = ddl ? ddl.value() : "";
    if (selectedValue === "") {
        $("#book_image_d").attr("src", "image/optional.jpg");
    } else {
        $("#book_image_d").attr("src", "image/" + selectedValue + ".jpg");
    }
}


/**
 * 新增書籍
 */
function addBook() { 

    // 新增書籍
    var grid = $("#book_grid").data("kendoGrid");

    var classId = $("#book_class_d").data("kendoDropDownList").value();
    var classNameObj = classData.find(m => m.value == classId);
    var bookStatusId = $("#book_status_d").data("kendoDropDownList") ? $("#book_status_d").data("kendoDropDownList").value() : "";
    if (!bookStatusId) bookStatusId = "A";
    var bookStatusNameObj = bookStatusData.find(m => m.StatusId == bookStatusId);

    var newId = 1;
    if (bookDataFromLocalStorage && bookDataFromLocalStorage.length > 0) {
        newId = Math.max.apply(null, bookDataFromLocalStorage.map(b => b.BookId)) + 1;
    }

    var book = {
        "BookId": newId,
        "BookName": $("#book_name_d").val(),
        "BookClassId": classId,
        "BookClassName": classNameObj ? classNameObj.text : "",
        "BookBoughtDate": kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd"),
        "BookStatusId": bookStatusId,
        "BookStatusName": bookStatusNameObj ? bookStatusNameObj.StatusText : "",
        "BookKeeperId": $("#book_keeper_d").data("kendoDropDownList") ? $("#book_keeper_d").data("kendoDropDownList").value() : "",
        "BookKeeperCname": "",
        "BookKeeperEname": "",
        "BookAuthor": $("#book_author_d").val(),
        "BookPublisher": $("#book_publisher_d").val(),
        "BookNote": $("#book_note_d").val()
    }

    if (book.BookKeeperId) {
        var member = memberData.find(m => m.UserId == book.BookKeeperId);
        if (member) {
            book.BookKeeperCname = member.UserCname;
            book.BookKeeperEname = member.UserEname;
        }
    }

    bookDataFromLocalStorage.push(book);
    localStorage.setItem("bookData", JSON.stringify(bookDataFromLocalStorage));

    // 更新 Grid
    grid.dataSource.data(bookDataFromLocalStorage);

    // 若為已借出狀態，新增借閱紀錄
    if (book.BookStatusId == "B" || book.BookStatusId == "C") {
        addBookLendRecord(book);
    }

    // 關閉 Window 並清除畫面
    $("#book_detail_area").data("kendoWindow").close();
    clear('detail');
 }

 /**
  * 更新書籍
  * @param {} bookId 
  */
function updateBook(bookId){
    
    // 更新書籍
    if (!bookId || bookId == '9999') {
        bookId = Number($("#book_id_d").val());
    }

    var book = bookDataFromLocalStorage.find(m => m.BookId == bookId);
    if (!book) return;

    var previousStatus = book.BookStatusId;

    book.BookName = $("#book_name_d").val();
    var classId = $("#book_class_d").data("kendoDropDownList").value();
    book.BookClassId = classId;
    var classObj = classData.find(m => m.value == classId);
    book.BookClassName = classObj ? classObj.text : "";
    book.BookBoughtDate = kendo.toString($("#book_bought_date_d").data("kendoDatePicker").value(), "yyyy-MM-dd");

    var bookStatusId = $("#book_status_d").data("kendoDropDownList").value();
    book.BookStatusId = bookStatusId;
    var statusObj = bookStatusData.find(m => m.StatusId == bookStatusId);
    book.BookStatusName = statusObj ? statusObj.StatusText : "";

    var bookKeeperId = $("#book_keeper_d").data("kendoDropDownList").value();
    var member = bookKeeperId == "" ? null : memberData.find(m => m.UserId == bookKeeperId);
    book.BookKeeperId = bookKeeperId;
    book.BookKeeperCname = member ? member.UserCname : "";
    book.BookKeeperEname = member ? member.UserEname : "";

    book.BookAuthor = $("#book_author_d").val();
    book.BookPublisher = $("#book_publisher_d").val();
    book.BookNote = $("#book_note_d").val();

    var grid = $("#book_grid").data("kendoGrid");
    grid.dataSource.pushUpdate(book);

    // 若由可借出轉為已借出/未領，則新增借閱紀錄
    if ((book.BookStatusId == "B" || book.BookStatusId == "C") && previousStatus != book.BookStatusId) {
        addBookLendRecord(book);
    }

    $("#book_detail_area").data("kendoWindow").close();
    clear();
 }

 /**新增借閱紀錄 */
 function addBookLendRecord() {  
    // 新增借閱紀錄
    var args = arguments;
    var book = null;
    if (args && args.length > 0 && typeof args[0] === 'object') {
        book = args[0];
    } else {
        var bookId = Number($("#book_id_d").val());
        book = bookDataFromLocalStorage.find(m => m.BookId == bookId);
    }

    if (!book) return;

    var lend = {
        BookId: book.BookId,
        BookKeeperId: book.BookKeeperId || "",
        BookKeeperCname: book.BookKeeperCname || "",
        BookKeeperEname: book.BookKeeperEname || "",
        LendDate: kendo.toString(new Date(), "yyyy-MM-dd")
    };

    bookLendDataFromLocalStorage.push(lend);
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
    // enable inputs (in case previously opened in detail/read-only mode)
    $("#book_detail_area").find("input,select,textarea").prop("disabled", false);
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
    bindBook(bookId);
    // disable inputs for detail view
    $("#btn-save").css("display", "none");
    $("#book_detail_area").find("input,select,textarea").prop("disabled", true);
    $("#book_detail_area").data("kendoWindow").title("書籍明細");
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
    $("#book_note_d").val(book.BookNote);
    var ddlClass = $("#book_class_d").data("kendoDropDownList");
    if (ddlClass) ddlClass.value(book.BookClassId);
    var ddlStatus = $("#book_status_d").data("kendoDropDownList");
    if (ddlStatus) ddlStatus.value(book.BookStatusId);
    var ddlKeeper = $("#book_keeper_d").data("kendoDropDownList");
    if (ddlKeeper) ddlKeeper.value(book.BookKeeperId);
    var dp = $("#book_bought_date_d").data("kendoDatePicker");
    if (dp && book.BookBoughtDate) dp.value(new Date(book.BookBoughtDate));
    // image
    if (book.BookClassId) {
        $("#book_image_d").attr("src", "image/" + book.BookClassId + ".jpg");
    } else {
        $("#book_image_d").attr("src", "image/optional.jpg");
    }
}

function showBookLendRecord(e) {

    var grid = getBooGrid();
    var dataItem = grid.dataItem(e.target.closest("tr"));
    var bookLendRecordData = bookLendDataFromLocalStorage.filter(m => m.BookId == dataItem.BookId);

    $("#book_record_grid").data("kendoGrid").dataSource.data(bookLendRecordData);
    $("#book_record_area").data("kendoWindow").title(dataItem.BookName).open();

}

/**
 * 清畫面
 * @param {*} area 
 */
function clear(area) {
    // 清除畫面，可指定 'detail' 或其他
    if (area == 'detail') {
        $("#book_id_d").val("");
        $("#book_name_d").val("");
        $("#book_author_d").val("");
        $("#book_publisher_d").val("");
        $("#book_note_d").val("");
        if ($("#book_class_d").data("kendoDropDownList")) $("#book_class_d").data("kendoDropDownList").value("");
        if ($("#book_status_d").data("kendoDropDownList")) $("#book_status_d").data("kendoDropDownList").value("");
        if ($("#book_keeper_d").data("kendoDropDownList")) $("#book_keeper_d").data("kendoDropDownList").value("");
        $("#book_image_d").attr("src", "image/optional.jpg");
        if ($("#book_bought_date_d").data("kendoDatePicker")) $("#book_bought_date_d").data("kendoDatePicker").value(new Date());
        // enable inputs after clearing detail
        $("#book_detail_area").find("input,select,textarea").prop("disabled", false);
        $("#btn-save").css("display", "");
        return;
    }

    $("#book_name_q").val("");
    if ($("#book_class_q").data("kendoDropDownList")) $("#book_class_q").data("kendoDropDownList").value("");
    if ($("#book_status_q").data("kendoDropDownList")) $("#book_status_q").data("kendoDropDownList").value("");
    if ($("#book_keeper_q").data("kendoDropDownList")) $("#book_keeper_q").data("kendoDropDownList").value("");
    // reset grid filter
    var grid = getBooGrid();
    grid.dataSource.filter({});

}

/**
 * 設定借閱狀態與借閱人關聯
 */
function setStatusKeepRelation() { 
    switch (state) {
        case "add"://新增狀態
            $("#book_status_d_col").css("display","none");
            $("#book_keeper_d_col").css("display","none");
            $("#book_status_d").prop('required', false);
            $("#book_keeper_d").prop('required', false);
            // set default status to A for new
            if ($("#book_status_d").data("kendoDropDownList")) $("#book_status_d").data("kendoDropDownList").value("A");
            break;
        case "update"://修改狀態
            $("#book_status_d_col").css("display", "");
            $("#book_keeper_d_col").css("display", "");
            $("#book_status_d").prop('required', true);

            var bookStatusId = $("#book_status_d").data("kendoDropDownList").value();

            if (bookStatusId == "A" || bookStatusId == "U") {
                $("#book_keeper_d").prop('required', false);
                $("#book_keeper_d").data("kendoDropDownList").value("");
                if ($("#book_detail_area").data("kendoValidator")) $("#book_detail_area").data("kendoValidator").validateInput($("#book_keeper_d"));
            } else {
                $("#book_keeper_d").prop('required', true);
            }
            break;
        default:
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