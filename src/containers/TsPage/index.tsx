import React, { Component } from "react";

interface IProps {
    name: string[];
}

class A extends Component<IProps> {
    render(): JSX.Element {
        return <div>{this.props.name}</div>;
    }
}

export default class TsPage extends Component<IProps> {
    render(): JSX.Element {
        return (
            <div>
                hello typescript!
                <A name={["a", "a", "c"]} />
            </div>
        );
    }
}
