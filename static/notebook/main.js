$.cl = {
    jstreeTypes: {
        bin: {icon: "/static/img/jstree/bin.png"},
        text: {icon: "/static/img/jstree/file.png"},
        md: {icon: "/static/img/jstree/file.png"},
        folder: {icon: "/static/img/jstree/folder.png"},
        default: {icon: "/static/img/jstree/folder.png"}
    },
    setCookie: function (key, value, expiredays){
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + expiredays);
        document.cookie = key + "=" + encodeURI(value)
            + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString())
    },
    getCookie: function (key) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                 var cookie = jQuery.trim(cookies[i]);
                 if (cookie.substring(0, key.length + 1) == (key + '=')) {
                     cookieValue = decodeURIComponent(cookie.substring(key.length + 1));
                     break;
                 }
             }
        }
        return cookieValue;
    },
    windowSizeMonitor: function (){
        if(document.documentElement.clientWidth < 605){
            $("#nav, #content").css({"display": "none"});
            $("#uavaliable-mask").css({"display": "block"});
        }else{
            $("#nav, #content").css({"display": "block"});
            $("#uavaliable-mask").css({"display": "none"});
        }
    },
    popupMessage: function (msg, title, timeout){
        var promptModal = $(".cl-prompt");
        if(promptModal.css("opacity") > 0){
            $.cl.clearMessage();
            setTimeout(function(){
                $.cl.popupMessage(msg, title)
            }, 200);
        }else{
            $("#cl-prompt-title").html(title || "提示");
            $("#cl-prompt-content").html(msg);
            promptModal.css({"opacity": "1", "top": "20px", "z-index": "10"}).children().eq(0).off("click").click($.cl.clearMessage);
            if (timeout > 0){setTimeout($.cl.clearMessage, timeout*1000);}
        }
    },
    clearMessage: function (){
        $(".cl-prompt").css({"opacity": "0", "top": "0px", "z-index": "-10"});
    },
    popupConfirm: function (msg, callback, cancelback, title){
        $("#cl-confirm-title").html(title || "提示");
        $("#cl-confirm-body").html(msg);
        $("#cl-confirm-cnf-btn").off("click").click(function(){
            $("#cl-confirm").modal("hide");
            try{
                callback();
            }catch (e){}
        });
        $("#cl-confirm-ccl-btn").css({"display": cancelback === false ? "none" : "initial"}).off("click").click(function(){
            $("#cl-confirm").modal("hide");
            try{
                cancelback();
            }catch (e){}
        });
        $("#cl-confirm").modal("show");
    },
    onLoginOrRegisted: function (data){
        if(data.err_code !== 0){
            var msg = "操作失败。详细信息：" + data.err_msg;
            $.cl.popupMessage(msg);
            return ;
        }
        $.cl.setCookie("madToken", data.token);
        $.cl.setCookie("email", data.email);
        window.contextData.loginInfo = {email: data.email};
        $.cl.renderLoginPage();
    },
    onSaveContent: false,
    onOpenFile: false,
    sendRequest: function (data, callback, fallback){
        fallback = fallback || function(){$.cl.popupMessage("操作失败，请检查你的网络连接。")};
        if (data.action !== "save"){
            $.ajax({url: "/notebook/api", type: "post", data: data, success: callback, error: fallback});
            return ;
        }
        if ($.cl.onSaveContent) return;
        $.cl.onSaveContent = true;
        $.ajax({
            url: "/notebook/api",
            type: "post",
            data: data,
            success: function (data){
                $.cl.onSaveContent = false;
                callback(data);
            },
            error: function (data) {
                $.cl.onSaveContent = false;
                fallback(data);
            }
        });
    },
    login: function (){
        var email = $("input[name=email]").val(),
            password = $("input[name=password]").val();
        if(email.length < 1 || password.length > 32 || password.length < 5){
            $.cl.popupMessage("请输入正确的邮箱和密码。");
            return ;
        }
        $.cl.sendRequest({action: "login", email: email, password: password}, $.cl.onLoginOrRegisted);
    },
    logout: function (){
        var afterLogOut = function (data){
            if(data.err_code !== 0){
                var msg = "操作失败。详细信息：" + data.err_msg;
                $.cl.popupMessage(msg);
                return ;
            }
            window.contextData.loginInfo = false;
            $.cl.renderCurrentEditDocumentTitle();
            $.cl.renderUnloginPage();
        };
        $.cl.sendRequest({action: "logout"}, afterLogOut);
    },
    regist: function (){
        var email = $("input[name=email]").val(),
            password = $("input[name=password]").val();
        if(email.length < 1 || password.length > 32 || password.length < 5){
            $.cl.popupMessage("请输入正确的邮箱和密码。");
            return ;
        }
        $.cl.sendRequest({action: "regist", email: email, password: password}, $.cl.onLoginOrRegisted);
    },
    rm: function (nodeId){
        var afterRmSucceed = function (data){
            if(data.err_code === 0){
                $.cl.popupMessage("删除成功！", null, 3)
                $("#jstree").jstree().refresh_node(nodeId.split("/").slice(0, -1).join("/"));
            }else{
                $.cl.popupMessage("删除失败：" + data.err_msg);
            }
        };
        $.cl.sendRequest({action: "rm", node_id: nodeId}, afterRmSucceed)
    },
    openJstreeNode: function (nodeId){
        var recursionOpenJstreeNode = function(nodeId, currentLayer){

            currentLayer = currentLayer || 0;
            currentLayer += 1;
            $("#jstree").on("open_node.jstree", function(){
                recursionOpenJstreeNode(nodeId, currentLayer);
            }).jstree().open_node(nodeId.split("/").slice(0, currentLayer).join("/"))
        };
        recursionOpenJstreeNode(nodeId);
    },
    showMkdirDialog: function(nodeId){
        var onMkdirDialogConfirmBtnClicked = function (){
            $("#input-modal").modal("hide");
            var nodeId = $(this).data("nodeId"),
                dirName = $("input[name=folder-name]").val();
            if (!dirName.match(/^[\.a-zA-Z0-9_\u4e00-\u9fa5]+$/)){
                $.cl.popupConfirm("文件名仅允许包含数字、字母、下划线以及汉字，不支持其它字符。请返回修改。", null, false, "文件名有误");
                return;
            }
            var onMkdirResponsed = function (data){
                if(data.err_code === 0){
                    $.cl.popupMessage("创建成功！", null, 3);
                    $("#jstree").jstree().refresh_node(nodeId);
                }else{
                    $.cl.popupMessage("创建失败：" + data.err_msg);
                }
            };
            $.cl.sendRequest({action: "mkdir", node_id: nodeId, dir_name: dirName}, onMkdirResponsed)
        };
        $("#input-modal-confirm-btn").data("nodeId", nodeId).off("click").click(onMkdirDialogConfirmBtnClicked);
        $("#input-modal-title").html("新建文件夹");
        $("#input-modal-body").html('<label>新的文件夹名称: <input class="redinput" type="text" name="folder-name"/></label>');
        $("input[name=folder-name]").keyup(function(e){if(e.keyCode === 13)$("#input-modal-confirm-btn").trigger("click");});
        $("#input-modal").modal("show");
    },
    showRenameDialog: function (nodeId, isdir){
        var onConfirmBtnClicked = function (){
            $("#input-modal").modal("hide");
            var nodeId = $(this).data("nodeId"),
                dirName = $("input[name=folder-name]").val();
            if (!dirName.match(/^[\.a-zA-Z0-9_\u4e00-\u9fa5]+$/)){
                $.cl.popupConfirm("仅允许包含数字、字母、下划线以及汉字，不支持其它字符。请返回修改。", null, false, "名称有误");
                return false;
            }
            var onRenameResponsed = function (data){
                if(data.err_code === 0){
                    $.cl.popupMessage("重命名成功！", null, 3);
                    var nodePath = nodeId.split("/").slice(0, -1).join("/");
                    $("#jstree").jstree().refresh_node(nodePath);
                    if (data.old_node_id === localStorage.currentDocument){
                        localStorage.currentDocument = nodePath + "/" + dirName;
                        $.cl.renderCurrentEditDocumentTitle();
                    }
                }else{
                    $.cl.popupMessage("重命名失败：" + data.err_msg);
                }
            };
            $.cl.sendRequest({action: "rename", node_id: nodeId, new_name: dirName}, onRenameResponsed);
        };
        $("#input-modal-confirm-btn").data("nodeId", nodeId).off("click").click(onConfirmBtnClicked);
        $("#input-modal-title").html(isdir ? "重命名文件夹" : "重命名文件");
        $("#input-modal-body").html([
            '<p style="text-align: center">将“' + nodeId.split("/").slice(-1) + '”重新命名。</p>',
            '<label>新的名称: <input class="redinput" type="text" name="folder-name"/></label>'
        ].join(""));
        $("input[name=folder-name]").keyup(function(e){if(e.keyCode === 13)$("#input-modal-confirm-btn").trigger("click");});
        $("#input-modal").modal("show");
    },
    showNewFileDialog: function (nodeId){
        var onConfirmBtnClicked = function (){
            $("#input-modal").modal("hide");
            var nodeId = $(this).data("nodeId"),
                fileName = $("input[name=folder-name]").val();
            if (!fileName.match(/^[\.a-zA-Z0-9_\u4e00-\u9fa5]+$/)){
                $.cl.popupConfirm("仅允许包含数字、字母、下划线以及汉字，不支持其它字符。请返回修改。", null, false, "名称有误");
                return false;
            }
            var onNewFileResponsed = function (data){
                if(data.err_code === 0){
                    $.cl.popupMessage("创建成功！", null, 3);
                    $("#jstree").jstree().refresh_node(nodeId);
                }else{
                    $.cl.popupMessage("创建失败：" + data.err_msg);
                }
            };
            $.cl.sendRequest({action: "new", node_id: nodeId, file_name: fileName}, onNewFileResponsed);
        };
        $("#input-modal-confirm-btn").data("nodeId", nodeId).off("click").click(onConfirmBtnClicked);
        $("#input-modal-title").html("新建文件");
        $("#input-modal-body").html([
            '<p>新建一个文档。系统根据文件扩展名判断文件类型，如果你填写二进制文件的文件类型，将不能对该文件进行编辑。',
            '这是一个示例： readme.md 。',
            '</p>',
            '<label>新的文件名: <input class="redinput" type="text" name="folder-name"/></label>'
        ].join(""));
        $("input[name=folder-name]").keyup(function(e){if(e.keyCode === 13)$("#input-modal-confirm-btn").trigger("click");});
        $("#input-modal").modal("show");
    },
    renderCurrentEditDocumentTitle: function (){
        if(localStorage.currentDocument){
            var jstreeInstence = $("#jstree").jstree();
            jstreeInstence.deselect_all();
            jstreeInstence.select_node(localStorage.currentDocument);
            $("#input-text-area").prev().html("编辑 - " + localStorage.currentDocument);
        }else{
            $("#input-text-area").prev().html("编辑");
        }
    },
    showSaveContentDialog: function (path, content){
        var onConfirmBtnClicked = function (){
            $("#input-modal").modal("hide");

            var nodeId = $(this).data("nodeId"),
                content = $(this).data("content"),
                fileName = $("input[name=folder-name]").val();

            if (!fileName.match(/^[\.a-zA-Z0-9_\u4e00-\u9fa5]+$/)){
                $.cl.popupConfirm("仅允许包含数字、字母、下划线以及汉字，不支持其它字符。请返回修改。", null, false, "名称有误");
                return false;
            }
            var onSaveContentResponsed = function (data){
                if(data.err_code === 0){
                    $.cl.popupMessage("保存成功！", null, 3);
                    $("#jstree").jstree().refresh_node(nodeId);
                }else{
                    $.cl.popupMessage("保存失败：" + data.err_msg);
                }
                localStorage.currentDocument = nodeId + "/" + fileName;
                $.cl.renderCurrentEditDocumentTitle();
            };
            $.cl.sendRequest({action: "save", node_id: nodeId + "/" + fileName, content: content}, onSaveContentResponsed);
        };
        $("#input-modal-confirm-btn").data("nodeId", path).data("content", content).off("click").click(onConfirmBtnClicked);
        $("#input-modal-title").html("保存文档到你的目录中");
        $("#input-modal-body").html([
            '<p>将你编辑的文档保存到“<strong>' + path + '/”</strong>下。</p>',
            '<p>这个路径可能是系统默认的，但如果你想改变存放的地方，请在左侧的目录结构中点击你想保存的位置，然后再按下“Ctrl”和“S”键。</p>',
            '<label>文件名: <input class="redinput" type="text" name="folder-name"/></label>'
        ].join(""));
        $("input[name=folder-name]").keyup(function(e){if(e.keyCode === 13)$("#input-modal-confirm-btn").trigger("click");});
        $("#input-modal").modal("show");
    },
    openFile: function (nodeId){
        if ($.cl.onOpenFile){
            $.cl.popupMessage("正在加载，请稍候。", undefined, 3);
            return;
        }else{
            $.cl.onOpenFile = true;
        }

        $("#input-text-area").prev().html("正在加载...");
        var onFileOpenedResponsed = function (data){
            $.cl.onOpenFile = false;
            if (data.err_code !== 0){
                var msg = "操作失败。详细信息：" + data.err_msg;
                $.cl.popupMessage(msg);
                return ;
            }
            var content = data.content;
            localStorage.currentDocument = data.path;
            $.cl.renderCurrentEditDocumentTitle();
            document.getElementById('input-text-area').value = content;
        };
        var onOpenFileFailed = function (e){
            $.cl.onOpenFile = false;
            $.cl.popupMessage("操作失败，请检查你的网络连接。")
        };
        $.cl.sendRequest({action: "open", "node_id": nodeId}, onFileOpenedResponsed, onOpenFileFailed);
    },
    renderJstreeContextMenu: function(node){
        var selectedNodeId = node.id;
        return node.type === "folder" ?
        {
            "new": {
                "label": "新建文档",
                "action": function () {
                    $.cl.showNewFileDialog(selectedNodeId);
                }
            },
            "mkdir": {
                "label": "新建文件夹",
                "action": function(){$.cl.showMkdirDialog(selectedNodeId)}
            },
            "rm": {
                "label": "删除",
                "action": function() {
                    $.cl.popupConfirm(
                        "确定要删除“" + selectedNodeId + "”？",
                        function () {
                            $.cl.rm(selectedNodeId)
                        },
                        undefined,
                        "删除文件夹"
                    )
                }
            },
            "rename": {
                "label": "重命名",
                "action": function () {
                    $.cl.showRenameDialog(selectedNodeId, true);
                }
            }
        } : {
            "open": {
                "label": "打开",
                "action": function () {
                    if(node.type === "text" || node.type === "md"){
                        $.cl.openFile(selectedNodeId);
                    }else{
                        $.cl.popupConfirm("不支持打开二进制文件。", null, false)
                    }
                }
            },
            "rename": {
                "label": "重命名",
                "action": function () {
                    $.cl.showRenameDialog(selectedNodeId);
                }
            },
            "rm": {
                "label": "删除",
                "action": function() {
                    $.cl.popupConfirm(
                        "确定要删除“" + selectedNodeId + "”？",
                        function () {
                            $.cl.rm(selectedNodeId)
                        },
                        undefined,
                        "删除文件"
                    )
                }
            },
            "share": {
                "label": "分享",
                "action": function(){
                    // $.cl.showMkdirDialog(selectedNodeId)
                }
            }
        }
    },
    getAndRenderDefaultFileListAndPage: function(){
        var jstreeInstance = $("#jstree");
        if (jstreeInstance.jstree()){
            jstreeInstance.jstree().destroy()
        }
        jstreeInstance.jstree({
            core: {
                multiple: false,
                check_callback: true,
                data: [{
                    text: "游客的文件夹",
                    state: {opened: true},
                    children: [{
                        text: "简介",
                        type: "text",
                        state: {opened: true, selected: true}
                    }]
                }]
            },
            types: $.cl.jstreeTypes,
            contextmenu: {
                select_node: false,
                items: {}
            },
            plugins: ["contextmenu", "types"]
        });
        document.getElementById('input-text-area').value = $("#default-file-content").val();
    },
    getAndRenderLoginedFileListAndPage: function(){
        var jstreeInstance = $("#jstree");
        if (jstreeInstance.jstree()){
            jstreeInstance.jstree().destroy()
        }
        jstreeInstance.on("ready.jstree", function(){
            if (localStorage.currentDocument){
                $.cl.openJstreeNode(localStorage.currentDocument);
                $.cl.openFile(localStorage.currentDocument);
            }
        }).on("select_node.jstree", function (e, node){
            if (!(node.node.type === "text" || node.node.type === "md")){
                return ;
            }
            var selectedNodeId = node.node.id;
            if (localStorage.currentDocument !== selectedNodeId){
                $.cl.openFile(selectedNodeId);
            }
        }).jstree({
            core: {
                multiple: false,
                data: {
                    url: "/notebook/api",
                    type: "post",
                    data: function (node) {
                        return {
                            id: node.id,
                            action: "get_file_list"
                        };
                    }
                }
            },
            types: $.cl.jstreeTypes,
            contextmenu: {
                select_node: false,
                items: $.cl.renderJstreeContextMenu
            },
            plugins: ["types", "contextmenu"]
        });
        document.getElementById('input-text-area').value = "";
    },
    renderLoginPage: function (){
        $.cl.releasePageResource();
        var navHtml = [
            '<span class="user-name">欢迎回来，' + window.contextData.loginInfo.email + '</span>',
            '<a href="javascript:void(0)" id="logout" ><i class="fa fa-sign-in" aria-hidden="true"></i> 注销</a>'
        ].join("");
        $(".right-nav").html(navHtml);
        $("#logout").off("click").click($.cl.logout);

        var leftNavHtml = [
            '<a href="javascript:void(0)" id="save-btn"><i class="fa fa-save" aria-hidden="true"></i> 保存</a>'
        ].join("");
        $("#top-dynamic-nav").html(leftNavHtml);
        $("#save-btn").off("click").click($.cl.saveContent);
        $.cl.getAndRenderLoginedFileListAndPage();
        document.getElementById("jstree").addEventListener("drop", $.cl.onDropFileToJsTree, false);
    },
    releasePageResource: function (){},
    renderUnloginPage: function (){
        $.cl.releasePageResource();
        $("#input-text-area").prev().html("编辑");
        var navHtml = [
            '<a href="javascript:void(0)" id="login" ><i class="fa fa-sign-in" aria-hidden="true"></i> 登录</a>',
            '<a href="javascript:void(0)" id="register" ><i class="fa fa-table" aria-hidden="true"></i> 注册</a>'
        ].join("");
        $(".right-nav").html(navHtml);
        $("#login").off("click").click(function(){
            $("#login-or-regist").html("登录");
            $("#login-modal").modal("show");
        }).next().off("click").click(function(){
            $("#login-or-regist").html("注册");
            $("#login-modal").modal("show");
        });
        $("#login-btn").off("click").click(function(){
            $("#login-modal").modal("hide");
            return $("#login-or-regist").html() === "注册" ? $.cl.regist() : $.cl.login();
        });
        $("#top-dynamic-nav").html("");
        $.cl.getAndRenderDefaultFileListAndPage();
    },
    saveContent: function (){
        if (!(window.contextData.loginInfo && window.contextData.loginInfo.email)){
            $.cl.popupMessage("请登录。");
            return ;
        }

        var content = $("#input-text-area").val();
        if (!content.trim(" \n\r\t")) return;
        var onSaveResponsed = function (){$.cl.popupMessage("保存成功！", null, 3)};
        if (localStorage.currentDocument){
            $.cl.clearMessage();
            $.cl.sendRequest({action: "save", node_id: localStorage.currentDocument, content: content}, onSaveResponsed);
            return ;
        }
        /* show confirm */
        var path = "",
            topSelected = $("#jstree").jstree().get_top_selected(true);
        if (topSelected.length < 1){
            path = window.contextData.loginInfo.email;
        }else{
            path = topSelected[0].type === "folder" ? topSelected[0].id : topSelected[0].parent;
        }
        $.cl.showSaveContentDialog(path, content);
    },
    daemonToTransMdId: undefined,
    oldContent: undefined,
    daemonToTransMd: function (){
        return setInterval(function(){
            var newContent = $("#input-text-area").val();
            if (newContent !== $.cl.oldContent){
                $.cl.oldContent = newContent;
                $("#content-text").html(marked(newContent));
            }
        }, 400);
    },
    onDropFileToJsTree: function (e){
        e.preventDefault();
        var fileList = e.dataTransfer.files;
        if(fileList.length === 0){
            return false;
        }
        var filename = fileList[0].name;
        if (!filename.match(/^[\.a-zA-Z0-9_\u4e00-\u9fa5]+$/)){
            $.cl.popupConfirm("文件名仅允许包含数字、字母、下划线以及汉字，不支持其它字符。请返回修改。", null, false, "文件名有误");
            return false;
        }

        var filesize = Math.floor((fileList[0].size)/1024);
        if(filesize > 4096){
            $.cl.popupConfirm("上传的文件大小不能超过4MB。", null, false, "文件大小超过限制");
            return false;
        }

        var path = $("#jstree").jstree().get_top_selected();
        path = (path.length < 1 || path[0] === ".") ? window.contextData.loginInfo.email : path[0];
        $.cl.popupConfirm(
            "将“" + filename + "”保存到“"+ path +"”?",
            function(){
                console.log("True: ");
            },
            null,
            "上传文件"
        );
        return false;
        /*
        console.log(filename);

        console.log("fileList[0]:", fileList[0]);
        return ;

        var data = new FormData($("#upload-file-form")[0]);
        data.set("file", fileList[0]);
        data.set("act", "upload_file");

        $.ajax({
            url: "/blog/api/",
            type: "post",
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success:function(data){
                console.log(data);
                showRewcentImage(data);
            },
            error:function(e){
                console.log(e);
            }
        });
        */
    },
    initPage: function (){
        (window.contextData.loginInfo && window.contextData.loginInfo.email ? $.cl.renderLoginPage : $.cl.renderUnloginPage)();
        $("input[name=password]").on('keyup', function(e){if(e.key === "Enter"){$("#login-btn").trigger("click")}});
        if ($.cl.daemonToTransMdId){
            clearInterval($.cl.daemonToTransMdId);
        }
        $.cl.daemonToTransMdId = $.cl.daemonToTransMd();
        /*
         * drag event
         * ctrl key event
         * tab key event
         */
        $(document).on({
            dragleave: $.cl.preventDefault,
            drop: $.cl.preventDefault,
            dragenter: $.cl.preventDefault,
            dragover: $.cl.preventDefault,
            keydown: function(event){
                /*
                if(window.event.keyCode == 9){
                    if($("#input-text-area").is(":focus")){
                        event.preventDefault();
                        insertStr("\t");
                    }
                    return ;
                }*/
                if(event.ctrlKey  &&  event.keyCode === 83){
                    event.preventDefault();
                    $("#save-btn").trigger("click");
                }
            }
        })
    },
    preventDefault: function (e){e.preventDefault()}
};
$(window).resize($.cl.windowSizeMonitor).on("ready", $.cl.windowSizeMonitor);$($.cl.initPage);


/*
 * TODO:
 * 1、文件夹重命名后，下方的文档没有即时更新。
 * 2、提示框倒计时。
 * 3、上传文件功能。
 *
 */