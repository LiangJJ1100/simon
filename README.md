## 西蒙游戏（Simon Game）是一款考验短期记忆力的游戏

**游戏规则：** 让玩家记住同颜色的亮灯循序后，依次点击，若通过考验将亮灯次数以及亮灯速度。若点击次序错误将消耗机会直至游戏结束。

**严格模式：** 将没有错误机会，点击间隔限制5秒，若超时则游戏结束。

### 关于项目 
* UI：antd-react 
* 手脚架：create-react-app 
* 声音：web audio api （兼容火狐和谷歌） 
* 彩灯布局：css3 roate()+skew() 可设置 4-8个彩灯 
* 颜色：hsl 通过色盘角度生成 
