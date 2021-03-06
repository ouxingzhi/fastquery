/*
query selector version 2.0
Copyright 2010
Dual licensed under the MIT or GPL Version 2 licenses.
author "司徒正美(zhongqincheng)"
http://www.cnblogs.com/rubylouvre/
 */
(function(window,undefined){
 
    var queryPseudoHasExp = function(first,next,flag_all){
        return {
            curry :function(lastResult,flag,a ,b){
                var result = [],ri = 0, uniqResult = {}, uid, find, c, node,tagName
                for(var i = 0 , el; el = lastResult[i++];){
                    uid = flag.getUID(el), find = uniqResult[uid];
                    if (find === void 0) {
                        c = 0, node = el.parentNode[first], tagName = el.nodeName
                        for (;node; node = node[next])
                            if (node.nodeType === 1 && (flag_all || tagName === node.nodeName)) {
                                ++c;
                                uniqResult[flag.getUID(node)] = a === 0 ? c === b : (c - b) % a === 0 && (c - b) / a >= 0;
                            }
                        find = uniqResult[uid];
                    }
                    if (find ^ flag.not)
                        result[ri++] = el;
                }
                return result;
            }
        }
    }
 
    var queryPseudoNoExp = function(direction,flag_all){
        return {
            curry : function(lastResult,flag){
                var result = [],ri = 0,node,tagName,find;
                for (var i = 0, el; el = lastResult[i++];) {
                    tagName = flag_all || el.nodeName, find = null
                    if (find === null && direction <= 0){
                        for (node = el.previousSibling; node; node = node.previousSibling)
                            if (node.nodeType === 1 && (flag_all || node.nodeName === tagName)) {
                                find = false;
                                break;
                            }
                    }
                    if (find === null && direction >= 0)
                        for (node = el.nextSibling; node; node = node.nextSibling)
                            if (node.nodeType === 1 && (flag_all || node.nodeName === tagName)) {
                                find = false;
                                break;
                            }
                    if (find === null)//如果本身就是first-child或last-child
                        find = true;
                    if (find ^ flag.not)//参与运算的两个值，如果两个相应bit位相同，则结果为0，否则为1。
                        result[ri++] = el;
                }
                return result;
            }
        }
    };
    window.dom = {
        UID:1,
        oneObject : function(array,val){
            var result = {},value = val !== void 0 ? val :1;
            for(var i=0,n=array.length;i < n;i++)
                result[array[i]] = value;
            return result;
        },
        sliceNode:function(nodes){
            return Array.prototype.slice.call(nodes);
        },
        isXML : function(doc){
            return (!!doc.xmlVersion) || (!!doc.xml) || (Object.prototype.toString.call(doc) === '[object XMLDocument]') ||
            (doc.nodeType === 9 && doc.documentElement.nodeName !== 'HTML');
        },
 
        queryId : function (id, root) {
            var el = (root || document).getElementById(id);
            return el && [el] || []
        },
 
        queryTag : function (tagName, parents, getUID) {
            var result = [], ri = 0, uniqResult = {},i , node, uid ,n = parents.length;
            switch (n) {
                case 0:
                    return result;
                case 1:
                    var nodes =  parents[0].getElementsByTagName(tagName);
                    return  this.sliceNode(nodes)
                default:
                    for (var k = 0 ; k < n ; k++) {
                        for (i = 0,nodes = parents[k].getElementsByTagName(tagName); node = nodes[i++];) {
                            if(dom.support.diffComment || node.nodeType === 1){
                                uid = node.uniqueID || getUID(node);
                                if (!uniqResult[uid]) {
                                    uniqResult[uid] = result[ri++] = node;
                                }
                            }
                        }
                    }
                    return result;
            }
        },
        _filters : { //伪类选择器的过滤器
            enabled : function(el){//标准
                return el.disabled === false && el.type !== "hidden";
            },
            disabled : function(el){//标准
                return el.disabled === true;
            },
            checked : function(el){//标准
                return el.checked === true;
            },
            indeterminate : function(el){//标准
                return el.indeterminate = true && el.type === "checkbox"
            },
            selected : function(el){
                el.parentNode.selectedIndex;//处理safari的bug
                return el.selected === true;
            },
            empty : function (el) {//标准
                return !el.firstChild;
            },
            lang : function (el, value) {//标准
                var reg = new RegExp("^" + value, "i")
                while (el && !el.getAttribute("lang"))
                    el = el.parentNode;
                return  !!(el && reg.test(el.getAttribute("lang")));
            },
            header : function(el){
                return /h\d/i.test( el.nodeName );
            },
            button : function(el){
                return "button" === el.type || el.nodeName === "BUTTON";
            },
            input: function(el){
                return /input|select|textarea|button/i.test(el.nodeName);
            },
            hidden : function( el ) {
                return el.type === "hidden" || (el.offsetWidth === 0 ) || (!-[1,] && el.currentStyle.display === "none") ;
            },
            visible : function( el ) {
                return el.type !== "hidden" && (el.offsetWidth || el.offsetHeight || (!-[1,] && el.currentStyle.display !== "none"));
            },
            target : function(el,exp,context){//标准
                var id = context.location.hash.slice(1);
                return (el.id || el.name) === id;
            },
            parent : function( el ) {
                return !!el.firstChild;
            },
            contains: function(el, exp) {
                return (el.textContent||el.innerText||'').indexOf(exp) !== -1
            },
            has : function(el, exp){
                return !!dom.query(exp,[el]).length;
            },
            "first-child":      queryPseudoNoExp(-1, true),//标准
            "last-child":       queryPseudoNoExp( 1, true),//标准
            "only-child":       queryPseudoNoExp( 0, true),//标准
            "first-of-type":    queryPseudoNoExp(-1, false),//标准
            "last-of-type":     queryPseudoNoExp( 1, false),//标准
            "only-of-type":     queryPseudoNoExp( 0 ,false),//标准
            "nth-child":        queryPseudoHasExp("firstChild", "nextSibling",     true),//标准
            "nth-last-child":   queryPseudoHasExp("lastChild",  "previousSibling", true),//标准
            "nth-of-type":      queryPseudoHasExp("firstChild", "nextSibling",     false),//标准
            "nth-last-of-type": queryPseudoHasExp("lastChild",  "previousSibling", false),//标准
            //与位置相关的过滤器
            first: function(index){
                return index === 0;
            },
            last: function(index, num){
                return index === num;
            },
            even: function(index){
                return index % 2 === 0;
            },
            odd: function(index){
                return index % 2 === 1;
            },
            lt: function(index, num){
                return index < num;
            },
            gt: function(index, num){
                return index > num;
            },
            eq: function(index, num){
                return index ===  num;
            }
        }
    }
 
    "text|radio|checkbox|file|password|submit|image|reset".replace(/\w+/g, function(name){
        dom._filters[name] = function(el){
            return el.type = name;
        }
    });
 
    dom.support = {
        sliceNodes : true
    };
    var HTML =  document.documentElement;
    var div = document.createElement("div");
    HTML.insertBefore(div, HTML.firstChild);
    var id = new Date - 0
    div.innerHTML = '<a name="'+id+'"></a><b id="'+id+'"></b>';
    dom.support.diffName = document.getElementById(id) !== div.firstChild;
    try{//检测是否支持
        dom.sliceNode(div.childNodes)
    }catch(e){
        dom.support.sliceNodes = false;
        dom.sliceNode = function(nodes){
            var i = nodes.length,result = [];
            while(i--){
                result[i] = nodes[i]
            }
            return result;
        }
    }
    div.appendChild(document.createComment(''))
    dom.support.diffComment = div.getElementsByTagName("*").length !== 3;
    HTML.removeChild(div)
 
    if(!dom.support.diffName){
        //如果浏览器的getElementById不能区分name与id
        dom.queryId = function(id,root){
            root = root || document;
            if(root.getElementById){
                var el = root.getElementById(id);
                return el && el.attributes['id'].value === id ? [el] :[]
            } else {
                var all = root.all[id];
                for(var i=0;el=all[i++];){
                    if(el.attributes['id'].value === id)
                        return [el]
                }
                return []
            }
        }
    }
 
 
    var getUIDHTML= function(node){
        return node.uniqueID || (node.uniqueID = dom.UID++);
    },
    getUIDXML = function(node){
        var uid = node.getAttribute("uniqueID");
        if (!uid){
            uid = dom.UID++;
            node.setAttribute("uniqueID", uid);
        }
        return uid;
    }
    dom.query = (function(){
        var reg_split = /(?:\(.*\)|[^,#:\.\s+>~[\](])+|[\.\[\]#:+>~,]|\s+/g
        var reg_id=  /^#([^,#:\.\s\xa0\u3000\+>~\[\(])+$/    //ID选择器
        var reg_tag = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/;   //标签选择器
        var reg_sequence  = /^([#\.:]|\[\s*)([\w_-]+)/;
        var reg_attribute = /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/ ;//属性选择器
        var reg_pseudo = /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/;
        var one_relation = dom.oneObject(">~+".split(''));
        var one_position = dom.oneObject("eq|gt|lt|first|last|even|odd".split("|"));
        var one_identify  = dom.oneObject(".#:".split(''));
        var one_ignore =   dom.oneObject(">~+,".split(''));
        var map_attribute = {
            "accept-charset": "acceptCharset",
            accesskey: "accessKey",
            bgcolor: "bgColor",
            cellpadding: "cellPadding",
            cellspacing: "cellSpacing",
            "char": "ch",
            charoff: "chOff",
            "class": "className",
            codebase: "codeBase",
            codetype: "codeType",
            colspan: "colSpan",
            datetime: "dateTime",
            defaultchecked:"defaultChecked",
            defaultselected:"defaultSelected",
            defaultvalue:"defaultValue",
            "for": "htmlFor",
            frameborder: "frameBorder",
            "http-equiv": "httpEquiv",
            ismap: "isMap",
            longdesc: "longDesc",
            maxlength: "maxLength",
            marginwidth:"marginWidth",
            marginheight:'marginHeight',
            nohref: "noHref",
            noresize:"noResize",
            noshade: "noShade",
            readonly: "readOnly",
            rowspan: "rowSpan",
            tabindex: "tabIndex",
            usemap: "useMap",
            vspace: "vSpace",
            valuetype: "valueType"
        };
 
        var queryAttribute = function(el,name){
            var special = map_attribute[name];
            if(special)
                return el[special];
            var flag = /^(?:src|href|style)$/.test(name) ? 2 : 0;
            return el.getAttribute(name,flag) || el[name];
        };
        var documentOrder = !-[1,] ? function (a, b) {
            return (a.sourceIndex - b.sourceIndex);
        }:function (a, b) {
            return (3 - (a.compareDocumentPosition(b) & 6));
        }
        var parseNth = function (exp) {
            var match = /(-?)(\d*)n([-+]?\d*)/.exec(exp === "even" && "2n" || exp === "odd" && "2n+1" || !/\D/.test(exp) && "0n+" + exp || exp);
            return {
                a: (match[1] + (match[2] || 1)) - 0,
                b: match[3] - 0
            };
        }
        var arrayize = function(sss){
            sss = sss.match(reg_split);
            var result = [],match,next,prev;
            for(var s=0,ss;ss = sss[s++];){
                next = sss[s],prev = sss[s-2];
                if(ss === ":" && next && next.indexOf("not") ===0 && (match = reg_pseudo.exec(ss+next))){
                    //如果是反选选择器，则将其里面的表达式取出来，转换为数组插入到选择器群里面进行匹配，
                    //并且让其后面紧跟着一个自定义的“反反选选择器”来标识反选选择器的结束
                    //注：反选选择器的括号里可以含有以下选择器:id,class,attribute,pseudo(not除外)
                    result = result.concat(":not").concat(arrayize(match[3])).concat(":yes");
                    s++;
                }else if(ss === "[" ){
                    while(next!=="]"){
                        ss += next;
                        next = sss[++s];
                    }
                    ss += next
                    result.push(ss)
                    s++
                }else if(one_identify[ss] && next){
                    result.push(ss+next);//合并id,class,attribute,pseudo选择器的界定符与它的主体部分
                    s++
                }else if(/^\s*$/.test(ss) ){//如果空白位于关系选择器的左右或整个群组的两端,忽略掉,否则重写后代选择器为!
                    if(one_ignore[next] || next ===void 0 || one_ignore[prev] || prev === void 0)
                        continue
                    result.push("!")
                }else{
                    result.push(ss);
                }
            }
            return result;
        }
        return function(selectors,lastResult){
            if (typeof selectors !== "string")
                return [];
            selectors = selectors.replace(/^[^#\(]*(#)/, "$1");
            if (!lastResult || lastResult.eval){
                //情况1，从document开始搜索
                lastResult = [document];
            }else{
                if (lastResult.nodeType){
                    //情况2，从某个文档对象或节点开始搜索
                    lastResult = [lastResult];
                }else if (!isFinite(lastResult.length)){
                    //情况3，如果起始对象非类数组对象，直接返回
                    return [];
                }else {
                    //情况4，强制将类数转转换为数组（因为下面要用到splice）
                    lastResult = dom.sliceNode(lastResult);
                }
            }
            var first = lastResult[0],
            doc = first.nodeType === 9 ? first : (first.ownerDocument || first.document),
            local = this,result = [], n = lastResult.length, ri = 0,i = 0,
            flag_xml = local.isXML(doc),
            flag_not = false,
            flag_elem = "nextElementSibling" in doc.documentElement ,
            prop = flag_elem ? "nextElementSibling" :"nextSibling",
            start = flag_elem ? "firstElementSibling" :"firstSibling",
            getUID = flag_xml? getUIDXML : getUIDHTML,
            match, next,node,nodes,uniqResult,flag_dupli ,flag_all,uid;
 
            if(!flag_xml && reg_id.test(selectors))//XML不支持getElementById
                return local.queryId(selectors.slice(1),doc);
            if( /^\w+$/.test(selectors))
                return local.queryTag(selectors,lastResult,getUID);
            // 情况5 如果支持querySelector，则逐一减少父集合与完成结果集
               if(doc.querySelectorAll ){
                if(n>1)
                    flag_dupli = true;
                for (; i < n; i++ ){
                    node = lastResult[i], node.id = node.id || node.uniqueID
                    if( node.nodeType === 1 && node.uniqueID )
                        selectors = "#"+node.id+" "+ selectors;
                    try {
                        result = result.concat(local.sliceNode(lastResult[i].querySelectorAll(selectors)));
                        lastResult.splice(i, 1);
                    } catch (e) { }finally{//IE8下querySelectorAll不在当前节点的孩子们中搜索
                        if (node.nodeType === 1 && node.uniqueID && node.id === node.uniqueID) {
                            node.removeAttribute( "id" );
                        }
                    }
                }
            }
            selectors = arrayize(selectors);
            for (var s = 0, selector,  tagName; selector=selectors[s++];) {
                next =  selectors[s],nodes = [],i = ri = 0,uniqResult = {},n=lastResult.length;
                if(selector === ",") {//★★★★并联选择器,就把上次的结果集放进最终结果集中
                    result = result.concat(lastResult);
                    flag_dupli = true,lastResult = [doc];
                    continue;
                }else if(selector === "!"){//★★★★后代选择器
                    if(next && (match = reg_tag.test(next)))//如果下一个选择器是标签或通配符，下一次遍历可以跳过
                        s++
                    tagName = match ? next : "*"
                    nodes = local.queryTag(tagName , lastResult, getUID);
                }else if(selector === ":not"&& next !== "*"){//★★★★反选选择器
                    flag_not = true
                    continue;
                }else if(selector === ":yes"){//★★★★反反选选择器
                    flag_not = false
                    continue;
                }else if (reg_tag.test(selector)) { //★★★★标签选择器与通配符选择器
                    nodes = local.queryTag(selector, lastResult, getUID);
                }else if(one_relation[selector]){//★★★★关系选择器
                    tagName = "*";
                    if (next && reg_tag.test(next)) {
                        tagName = flag_xml ? next : next.toUpperCase();
                        s++;
                    }
                    flag_all = tagName === "*";
                    switch (selector) {
                        case ">"://★★★亲子选择器
                            for(;i < n;i++)
                                for (node = lastResult[i][start]; node; node = node[prop])
                                    if ((flag_elem || node.nodeType === 1) && (flag_all || tagName === node.nodeName))
                                        nodes[ri++] = node;
                            break;
                        case "+"://★★★相邻选择器
                            for(;i < n;i++)
                                for (node = lastResult[i][prop]; node; node = node[prop])
                                    if (flag_elem || node.nodeType === 1) {
                                        if (flag_all || tagName === node.nodeName)
                                            nodes[ri++] = node;
                                        break;
                                    }
                            break;
                        case "~":// ★★★兄长选择器
                            for(;i < n;i++)
                                for ( node = lastResult[i][prop]; node; node = node[prop])
                                    if ( (flag_elem || node.nodeType === 1) && (flag_all || tagName === node.nodeName)) {
                                        uid = node.uniqueID || getUID(node);
                                        if (uniqResult[uid]){
                                            break;
                                        }else {
                                            uniqResult[uid] = nodes[ri++] = node;
                                        }
                                    }
                    }
                }else if ((match = reg_sequence.exec(selector))){
                    if (n === 1 && lastResult[0] === doc){
                        switch(match[1]){
                            case "#"://★★★★ID选择器 '.aaa,span,#aaa''
                                if(!flag_xml){//XML不支持getElementById
                                    nodes = local.queryId(match[2],doc);
                                    break
                                }
                            case ":"://★★★★几个简单的伪类选择器
                                switch (match[2]) {
                                    case "scope":
                                        nodes = [doc];//直接查找不进行过滤
                                        break;
                                    case "root":
                                        nodes = [doc.documentElement];//直接查找不进行过滤
                                        break;
                                    case "link":
                                        var links = doc.links;
                                        if (links) {//直接查找不进行过滤
                                            nodes = local.sliceNode(links);
                                        }
                                }
                                break;
                            case "."://★★★★类选择器
                                if(doc.getElementsByClassName){
                                    nodes = local.sliceNode(doc.getElementsByClassName(selector.slice(1)));
                                }
                        }
                    }else{
                        var all = n ? lastResult : local.queryTag("*", lastResult, getUID), filter;
                        switch (match[1]) {
                            case "#":
                                filter = ["id", "=", match[2]];
                                break;
                            case ".":
                                filter = ["class", "~=", match[2]];
                                break;
                            case ":":
                                match = selector.match(reg_pseudo);
                                var key = match[1],exp = match[3]
                                filter = local._filters[key];  //这里处理除yes,not之外的所有伪类
                                break;
                            default:
                                match = selector.match(reg_attribute);
                                filter = [match[1], match[2], match[4]]
                        }
                        if(all.length && filter){
                            if(typeof filter === "function" ){
                                if(one_position[key]){  //处理位置伪类
                                    //如果exp为空白则将集合的最大索引值传进去，否则将exp转换为数字
                                    exp = (exp === ""|| exp === void 0) ? n - 1 : ~~exp;
                                    for (; node = all[i];){
                                        if(filter(i++, exp) ^ flag_not)
                                            nodes[ri++] = node;
                                    }
                                }else{
                                    //处理target root checked disabled empty enabled lang 等伪类
                                    for (; node = all[i++];){
                                        if(filter(node, exp, doc) ^ flag_not)
                                            nodes[ri++] = node;
                                    }
                                }
                            }else if((typeof filter === "object") && filter.curry){
                                var p = parseNth(exp);//处理结构伪类中的子元素过滤伪类
                                nodes = filter.curry(all, {
                                    getUID:getUID,
                                    not:flag_not
                                }, p.a, p.b);
                            }else {
                                //处理属性伪类
                                var operator = filter[1], value = filter[2], attrib, flag;
                                for (; node = all[i++];){
                                    attrib = queryAttribute(node, filter[0]);//取得元素的实际属性值
                                    flag = (attrib != null) && (attrib !== "");
                                    if(flag && operator){
                                        switch (operator) {
                                            case "=":
                                                flag = attrib === value;
                                                break;
                                            case "!=":
                                                flag = attrib !== value;
                                                break;
                                            case "~=":
                                                flag = (" " + attrib + " ").indexOf(value) !== -1;
                                                break;
                                            case "^=":
                                                flag = attrib.indexOf(value) === 0;
                                                break;
                                            case "$=":
                                                flag = attrib.lastIndexOf(value) + value.length === attrib.length;
                                                break;
                                            case "*=":
                                                flag = attrib.indexOf(value) !== -1;
                                                break;
                                            case  "|=":
                                                flag = attrib === value || attrib.substring(0, value.length + 1) === value + "-";
                                                break;
                                        }
                                    }
                                    if (!!flag  ^ flag_not)
                                        nodes[ri++] = node;
                                }
                            }
 
                        }//结束过滤
                    }//结束分支
                }//结束
                if(nodes.length ) {
                    lastResult = nodes;
                }else{
                    break;
                }
            }//大循环
            result = result.concat(lastResult);
            if(result.length > 1 && flag_dupli ){
                i=ri=0,uniqResult = {},nodes= [];
                for(;node = result[i++];){
                    uid = node.uniqueID || getUID(node);
                    if (uniqResult[uid]){
                        break;
                    }else {
                        uniqResult[uid] = nodes[ri++] = node;
                    }
                }
                result = nodes.sort(documentOrder);
            }
            return result;
        }
    })();
 
})(window);
