import React from 'react';
import './Simon.css';

import {Row, Col,Switch, Button, Icon, Slider, notification, Popover} from 'antd';

export default class Simon extends React.Component {
    constructor(){
        super();
        this.state ={
            data: [], // 游戏数据长度
            speed: 800, // 播放事件间隔基数
            currSpeed: 800, // 当前的播放时间
            onOff: false, // 控制台开关
            click: false, // 圆盘开关
            strict: false,  // 是否严格模式
            difficulty: 4, // 难度  色块数量
            score: 0, //统计分数
            currStep: 0, // 缓存当前的步数情况
            currNum: 0, // 获取当前点击的按钮
            cursor: 'default', // 转变指针的状态
            hp:0, //  普通模式下的错误机会
            seconds: 5,
        }
        this.timer = null;// 对象的定时器变量
        this.countDown = this.countDown.bind(this);
        this.initData = this.initData.bind(this);
        this.getRandomData = this.getRandomData.bind(this);
        this.playData = this.playData.bind(this);
        this.error = this.error.bind(this);
        this.gameOverNotification = this.gameOver.bind(this);
        this.onOffChange = this.onOffChange.bind(this);
        // 获取表单数据的函数对象  由于对象不复用，将函数定义到
        this.toSimonControlMethod = {
            // 游戏开关 当启动时播放动画
            onOffChange: this.onOffChange,
            difficultyChange: value => this.setState({ difficulty: value }),
            strictChange: bool => {
                this.setState({
                    strict: bool,
                    hp: 0,
                })
            },
            initData: this.initData,
            // 重置数据 播放动画
        }
    }
    render() {
        return (
            <div className='simonTable' >
                <SimonControl parentMethod={this.toSimonControlMethod } allState={this.state}  ></SimonControl>
                <SimonDisk allState={this.state} 
                upFn={this.catchDiskFn.bind(this)} 
                changeData={this.changeData.bind(this)}
                ></SimonDisk>
            </div>
       )
    }
    catchDiskFn(fnObj){ //获取子组件的方法
        this.diskFn = fnObj;
    }
    getRandomData(){ // 使用this获取数据
        let {difficulty} = this.state;
        return Math.floor(Math.random()*difficulty)
    }

    initData(){
        let {strict}  = this.state;
        let newData = []
        newData.push(this.getRandomData());
        this.setState({
            data: newData,
            currStep: 0,
            currSpeed: this.state.speed,
            cursor: 'default',
            score: 0,
            hp: (strict) ? 1 : 3,
        },()=>{this.playData()})
    }

    onOffChange(){
        let { onOff, click } = this.state;
        let preOnOff = onOff; // 缓存上一次的开关状态
        this.setState({
            onOff: !onOff,
            click: !click,
            // click: !click, click 有播放函数操作
        })
        if (!preOnOff) {// 当下一次为真时
            this.initData(); //初始化数据并开始游戏
        }
    }

    playData() {
        let { data, currSpeed ,strict} = this.state;
        let { itemOnMouseDown, itemOnMouseUp, } = this.diskFn;
        // 延时0.5秒 
        if(strict){
            // 严格模式下 先清理定时器
            this.countDown('clear')
        }
            this.setState({
                click: false,
                cursor: 'wait'
            });
            // 播放结束的状态
            setTimeout(() => {
                this.setState({
                    click: true,
                    cursor: 'default',
                },()=>{
                    // 处于严格模式下 数据播放结束 设置定时器
                    if(strict){
                        this.countDown('set');
                    }
                })
                
            }, currSpeed * (data.length))
            // 进行数据播放
        setTimeout(() => {
            for (let i = 0, len = data.length; i < len; i++) {
                setTimeout(() => {
                    itemOnMouseDown(data[i])
                }, currSpeed * i);
                setTimeout(() => {
                    itemOnMouseUp(data[i])
                }, currSpeed * i + 100)
            }
        },500)
        
    }
    changeData(num){
        var {data, currStep, strict, score, difficulty, speed, hp} = this.state;
        if(num === data[currStep]){
            // 已经完成游戏
            if(currStep+1 === data.length){
                let newData = data;
                newData.push(this.getRandomData()) // 创建新的随机数
                this.setState({ 
                    currStep: 0,    // 初始化部署
                    data: newData, // 跟新数据
                    score: score + (data.length*difficulty+4), //累计分数
                    currSpeed: parseInt(speed * ( .97 ** data.length),10),
                 })
                setTimeout(()=>{
                    this.playData()
                },1000)
            }else{
                // 游戏未完成
            this.setState({ currStep: ++currStep })// 增加 当前的步数
            strict && this.countDown('reset'); //处于严格模式下重置定时器 
            }
        }else{
            // 错误声音
            setTimeout(this.diskFn.createWarnAudio,250)
            // 输入错误：严格模式 -> 结束游戏提示 - 清空数据 关闭游戏
            if(hp === 1){
                this.gameOver()
                this.setState({ hp: --hp })
            }else{
                // 错误提示
                this.error();
                // 立即重新播放，up函数会被忽略
                setTimeout(this.playData,150);
                this.setState({ 
                    currStep: 0,
                    hp: --hp,
            }) // 重置步数
            }
        }
    }
    gameOver(){
        let {score, strict} = this.state;
        let description = 
        (<div>
            <p>获得分数：{score}</p>
            <p>点击开始重新游戏！</p>
        </div>);
        // 弹出 提示框
        notification.open({
            message: '游戏结束',
            description:description,
            icon:<Icon type='smile-circle' style={{color: '#108ee9'}} />
        })
        setTimeout(this.onOffChange, 250)// 游戏结束 关闭游戏
        strict && this.countDown('clear');
    }
    // 抖动函数
    error() {
        notification.error({
            duration: 2,
            message:'循序错误！！'
        })
    }
    /**
     * 严格模式下的定时器函数
     * @param {*string} operation set 设置定时器 || clear 清除定时器 || reset重置定时器
     */
    countDown(operation){
        let {seconds} = this.state;
        if (operation === 'set') {
            this.timer = setInterval(() => {
                let newSeconds = seconds;
                this.setState({ seconds: --seconds })
                // 超时 结束游戏
                if(--newSeconds === -1 ){
                    console.log('已经超时')
                    this.countDown('clear');// 清理定时器
                    this.gameOver();// 结束游戏
                    this.diskFn.createWarnAudio();
                }
           }, 1000);
        } else if (operation === 'clear') {
            clearInterval(this.timer);
            this.setState({ seconds:5 })
        }else if(operation === 'reset'){
            this.countDown('clear');
            this.countDown('set');
        }
    }
}

class SimonControl extends React.Component {
    render() {
        let { click, onOff, data, score, hp, strict, seconds} = this.props.allState;
        var parentMethod = this.props.parentMethod;
        let gameRule = (
            <div className='gameRule' >
                <p className='gameRuleItem' ><span>规则：</span>玩家需要记住不同颜色灯的亮起循序一次点击</p>
                <p className='gameRuleItem' ><span>当点击次序正确：</span>将添加亮灯个数和亮灯速度</p>
                <p className='gameRuleItem' ><span>当点击次序错误：</span>消耗机会或结束游戏获得分数</p>
                <p className='gameRuleItem' ><span>普通模式：</span>拥有3次错误机会</p>
                <p className='gameRuleItem' ><span>严格模式：</span>1.没有错误机会 2.超过5秒未点击即游戏结束</p>
            </div>)
        return (
            <Row>
                <Row className='controlItem' >
                    <Col span={12}>
                    <Button.Group>
                          <Button type='primary'
                            disabled={!click && onOff}
                            onClick={parentMethod.onOffChange}
                            size='large'
                        >{onOff ? "关闭" : "开始"}</Button>
                        <Button type='primary' icon="reload"
                            size='large'
                            onClick={parentMethod.initData} // 传入参数 true调用 //使用函数包裹调用，不然加载即执行
                            disabled={!click && onOff}>
                        </Button>
                    </Button.Group>
                        </Col>
                    <Col span={4} push={8} >
                    <Popover placement='bottomRight' content={gameRule} >
                            <Button>游戏说明</Button>
                    </Popover>
                    </Col>

                </Row>
                <Row className='controlItem' >
                    <Switch
                        checkedChildren="严格模式" unCheckedChildren="严格模式"
                        disabled={onOff ? true : false}
                        onChange={(bool) => { parentMethod.strictChange(bool) }}>
                    </Switch>
                </Row>
                <Row className='controlItem' type='flex' align='middle' >
                    <Col span={8} >选择按钮数量：
                            <Slider min={4} max={8}
                            tipFormatter={null}
                            marks={{ 4: '4', 5: '5', 6: '6', 7: '7', 8: '8' }}
                            onAfterChange={(value) => { parentMethod.difficultyChange(value) }}
                            disabled={onOff ? true : false} ></Slider>
                    </Col>
                </Row>
                <Row className='controlITem' >{strict ? '点击倒计时：' + seconds : '剩余机会：' + hp} </Row>
                <Row className='controlItem' >{'亮灯个数：' + data.length}</Row>
                <Row className='controlItem' >{'获得分数：' + score}</Row>
            </Row>
        )
    }
}

class SimonDisk extends React.Component{
    render(){
        return (
            <Row>
                <Col align='middle'  >
                <div className='simonDiskWraper' style={{ cursor: this.props.allState.cursor }}>
                    {this.renderSimonDiskItem()}
                </div>
                </Col>
            </Row>
        )
    }

    // 渲染
    renderSimonDiskItem(){
        let {click, difficulty} = this.props.allState;
        var len = difficulty;
        var allItem = [];
        var angle = 360 / len; // 角度单位
        for(let i = 0; i < len; i++){
            let style = {
                'transform': `rotate(${i*angle+90}deg) skew(${90-angle}deg)`, // 旋转 
                'backgroundColor': `hsl(${i*angle+90},90%,65%)` //背景颜色
            }
            allItem.push(
            <div
            className='simonDiskItem' 
            style={style} key={i} ref={'item'+i}
            onMouseDown={(click)?this.itemOnMouseDown.bind(this, i, len):null}
            onMouseOut= {(click)?this.itemOnMouseUp.bind(this, i, len):null}
            onMouseUp = {(click)?this.itemOnMouseUp.bind(this, i, len):null}
            ></div>)
        }
        return allItem;
    }
    // // 循环播放一次
    // initAnimation(){
    //     let {difficulty} = this.props.allState;
    //     for(let i = 0, len = difficulty; i < len; i++){
    //         setTimeout(()=>{
    //             this.itemOnMouseDown(i);
    //         },500/len*i);
    //         setTimeout(()=>{
    //             this.itemOnMouseUp(i)
    //         },500/len*i+50)
    //     }
    // }
    playData() {
        let {currSpeed, data} =this.props.allState; // 获取具体变量，减小重复代码
        for (let i = 0, len = data.length; i < len; i++) {
            setTimeout(() => {
                this.itemOnMouseDown(data[i])
            },currSpeed * i);
            setTimeout(() => {
                this.itemOnMouseUp(data[i])
            }, currSpeed * i + (currSpeed / 2));
        };
    }
    // 将方法 向父级传递
    componentDidMount(){
        this.props.upFn({
            // initAnimation: this.initAnimation.bind(this),
            itemOnMouseDown: this.itemOnMouseDown.bind(this),
            itemOnMouseUp: this.itemOnMouseUp.bind(this),
            createWarnAudio: this.createWarnAudio.bind(this),
        })
    }

    itemOnMouseDown(i){ // 由于需要函数触发， 所以没有
        let { click } = this.props.allState;
        // 修改背景颜色
        let angle = (360/this.props.allState.difficulty)*i
        this.refs['item'+i].style.backgroundColor =  `hsl(${angle+90} ,70%, 40%)` ; // 修改背景颜色
        this.createAudio(i); // 播放相关音频
        click && this.props.changeData(i); // 修改 游戏数据
    }
    
    itemOnMouseUp(i){
        let angle = (360/this.props.allState.difficulty)*i;
        this.refs['item'+i].style.backgroundColor =  `hsl(${angle+90} ,90%, 65%)` ; // 修改背景颜色
    }
    // 创建音频 创建声音  // 扩展  有一秒的默认播放长度 ， 接受参数设置  time 播放时长 
    createAudio(index, time=1){
        // console.log(index
        // bind绑定参数
        window.AudioContext = window.AudioContext || window.webkitAudioContext; //浏览器兼容
        // 常规 部署
        // 绘制音频数据
        var audioCtx = new AudioContext(); // 创建音频环境
        var oscillator = audioCtx.createOscillator(); // 创建波段
        var gainNode = audioCtx.createGain(); // 创建 音量
        oscillator.connect(gainNode); //关联波段和音量
        gainNode.connect(audioCtx.destination); // 音量和设备关联
        oscillator.type = 'square'; // 设置波段类型 方形
        // 设置波段
        oscillator.frequency.value =  (index*50) + 300; // 设置波段频率
        //播放动作
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // 先把当前音量设为 0
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01); // 0.01秒后为 100%音量
        oscillator.start(audioCtx.currentTime); // 波段开始
        // 结束播放
        (time===1) && gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime +1); // 1秒时间内音量递减到 0
        oscillator.stop(audioCtx.currentTime + time); //波段结束
    }
    // 创建错误的警告声音
    createWarnAudio(){ // 哔哔两声响
        this.createAudio(10,.15)
        setTimeout(()=>{this.createAudio(10,.15)},250)
    }

}