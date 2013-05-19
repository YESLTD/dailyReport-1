//对应数据库中的数据结构

var DEPARTMENT_MOBILE = 1;
var DEPARTMENT_DESIGN = 2;
var DEPARTMENT_TEST1 = 3;
var DEPARTMENT_TEST2 = 4;

var USERS =
    { "users":
    [
        {"uname": "李歆扬", "uid": "90500", "udep": 1, "udpname": "移动产品部","onjob": true},
        {"uname": "廖青", "uid": "83124", "udep": 1, "udpname": "移动产品部","onjob": true},
        {"uname": "胡巍巍", "uid": "89232", "udep": 1, "udpname": "移动产品部","onjob": true},
        {"uname": "徐山", "uid": "90593", "udep": 1, "udpname": "移动产品部","onjob": true},
        {"uname": "赵阳", "uid": "82664", "udep": 2, "udpname": "交互设计部","onjob": true},
        {"uname": "许海芝", "uid": "89176", "udep": 2, "udpname": "交互设计部","onjob": true},
        {"uname": "李诗娇", "uid": "89866", "udep": 2, "udpname": "交互设计部","onjob": true},
        {"uname": "王鹏", "uid": "91579", "udep": 2, "udpname": "交互设计部","onjob": true}
    ]};

var DEPARTMENT =
    { "department":
    [
        {"dpname": "移动产品部", "dpnum" : 1,
            "dusers":[
                {"uname": "李歆扬", "uid": "90500", "onjob": true},
                {"uname": "廖青", "uid": "83124", "onjob": true},
                {"uname": "胡巍巍", "uid": "89232", "onjob": true},
                {"uname": "徐山", "uid": "90593", "onjob": true}
            ]
        },
        {"dpname": "交互设计部", "dpnum" : 2,
            "dusers":[
                {"uname": "赵阳", "uid": "82664", "onjob": true},
                {"uname": "许海芝", "uid": "89176", "onjob": true},
                {"uname": "李诗娇", "uid": "89866", "onjob": true},
                {"uname": "王鹏", "uid": "91579", "onjob": true}
            ]
        },
        {"dpname": "test1部", "dpnum" : 3},
        {"dpname": "test2部", "dpnum" : 4}
    ]};

var LOGS =
    {"logs":
    [
        {"date": "2013/05/20", "logger_name": "李歆扬", "logger_id": "90500", "udep": "1", "udpname": "移动产品部",
         "modifylog" : [
             {"lastEditor": "192.168.0.11", "lastModifiedBy": "9:30", "done": 1, "todo": 2, "remark": 3},
             {"lastEditor": "192.168.0.41", "lastModifiedBy": "18:20", "done": 4, "todo": 2, "remark": 3}
         ]},
        {"date": "2013/05/20", "logger_name": "赵阳", "logger_id": "82664", "udep": "2", "udpname": "交互设计部",
        "modifylog" : [
            {"lastEditor": "192.168.0.21", "lastTime": "14:20", "done": 1, "todo": 2, "remark": 3}
        ]}
    ]};