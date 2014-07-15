# SUSTC URP System API
v0.82

------

这是一份URP系统的第三方接口API文档。
Power by 南方科技大学计算机研究协会

------

## 绑定用户

`https://sustc.us/urp/bind?username=[username]&password=[password]`

* 成功 `{"err":0}`
* 失败 `{"err":-1}`

---

## 更新用户数据

`https://sustc.us/urp/update`

* 成功 `{"err":0}`
* 失败 `{"err":-1}` or `{"err":"[errinfo]"}`

---

## 获取用户信息

`https://sustc.us/urp/info`

* 成功 `{"id":[id],"name":"[realname]"", ...}`
    * `"gender"`:
        * 0: 未知
        * 1: 男
        * 2: 女
* 失败 `{"err":1}` or `{"err":"[errinfo]"}`


---

## 获取学期信息

`https://sustc.us/urp/terms`

* 成功 `[{"name":"[termname]","id":"[termid]", ...}, ...]`
* 失败 `{"err":1}` or `{"err":"[errinfo]"}`

---

## 获取课程信息

`https://sustc.us/urp/courses`

* 成功 `[{"name":"[termsname]", ...}, ...]`
* 失败 `{"err":1}` or `{"err":"[errinfo]"}`

---

## 使用顺序

获取信息必须要在完成绑定和更新数据之后。

------

再一次感谢您花费时间阅读这份API文档，祝您开发愉快！

作者 [teng SUSTC-IT]
2014/04/18
