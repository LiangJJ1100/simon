import React, {Component} from 'react';

export default class Test extends Component{
    constructor(props){
        super(props);
        this.state = {
            data: [],
        }
        this.changeData = this.changeData.bind(this);
    }
    render(){
        return(
            <button onClick={this.changeData} >{'测试'} </button>
        )
    }

    changeData(){
        console.log(this.state)
        var {data} = this.state;
        var preData = data;
        preData.push(2);
        this.setState({ data: preData }, console.log(this.state))

    }
}