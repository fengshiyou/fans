import pandora from 'pandora';
const Symbol = pandora.interface.Symbol;
const zrender = pandora.zrender;

export default class CircleNode extends Symbol {
    /**
     * 构造函数
     * @param  {[type]} model  数据对象
     * @param  {[type]} option 一些配置
     * @return {[type]}        [description]
     */
    constructor(model) {
        super(model.id);
        this.model = model;
    }

    afterAdded() {
        // this.chart.updateShape(this.getPicture(), {
        //     scale: [1, 1]
        // }, true, {
        //     time: 300,
        //     delay: 50
        // });
    }

    beforeRemove() {
        // const picture = this.getPicture();
        // return this.chart.updateShape(picture, {
        //     scale: [0.2, 0.2]
        // }, {
        //     time: 300
        // });
    }

    drawPicture() {
        const group = new zrender.Group({
            position: [this.x, this.y]
        });
        this.group = group;
        const attrs = _getShapeAttrs.call(this);
        const circle = new zrender.Circle(attrs.circle);
        let icon = null;
        let iconZP = null;
        const userSetting = this.chart.get('userSetting');
        const { showHeaderImage } = userSetting.baseConfig;
        if (this.model.zp) {
            // 配置照片是否显示
            if (showHeaderImage) {
                attrs.image.invisible = false;
                attrs.icon.invisible = true;
                iconZP = new zrender.Image(attrs.image);
                icon = new zrender.Text(attrs.icon);
            } else {
                attrs.image.invisible = true;
                attrs.icon.invisible = false;
                iconZP = new zrender.Image(attrs.image);
                icon = new zrender.Text(attrs.icon);
            }
        } else {
            icon = new zrender.Text(attrs.icon);
        }
        this.icon = icon;
        if (iconZP) {
            this.iconZP = iconZP;
        }
        this.circle = circle;
        this.text = new zrender.Text(attrs.text);
        this.text.attr({
            position: [-this.text.getBoundingRect().width / 2, attrs.r + 2]
        });
        this.icon.setClipPath(this.circle);
        if (this.iconZP) {
            this.iconZP.setClipPath(this.circle);
        }
        group.add(icon);
        if (iconZP) {
            group.add(iconZP);
        }
        group.add(this.text);
        // 核心节点
        this.coreImg = new zrender.Text(attrs.core);
        group.add(this.coreImg);
        this.scoreText = new zrender.Text(attrs.coreScore);
        group.add(this.scoreText);
        // 标记节点
        this.flagImg = new zrender.Text(attrs.flag);
        group.add(this.flagImg);

        // 设置里面的标签显示
        if (attrs.labels) {
            attrs.labels.forEach(item => {
                let labelText = new zrender.Text(item.icon);
                labelText.setClipPath(new zrender.Circle(item.circle));
                group.add(labelText);
            });
        }
        group.on('mouseover', evt => {
            this.chart.updateShape(group, {
                scale: [2, 2]
            }, false, {
                time: 100
            });
        });
        group.on('mouseout', evt => {
            this.chart.updateShape(group, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
        });
        return group;
    }

    updatePicture() {
        const attrs = _getShapeAttrs.call(this);
        const userSetting = this.chart.get('userSetting');
        const { showHeaderImage } = userSetting.baseConfig;
        if (attrs.image && attrs.icon) {
            if (this.model.zp && showHeaderImage) {
                attrs.image.invisible = false;
                attrs.icon.invisible = true;
            } else {
                attrs.image.invisible = true;
                attrs.icon.invisible = false;
            }
        }
        if (this.circle) {
            this.circle.attr(attrs.circle);
        }
        this.icon.attr(attrs.icon);
        if (this.iconZP) {
            this.iconZP.attr(attrs.image);
        }
        this.icon.setClipPath(this.circle);
        if (this.iconZP) {
            this.iconZP.setClipPath(this.circle);
        }
        this.text.attr(attrs.text);
        this.text.attr({
            position: [-this.text.getBoundingRect().width / 2, attrs.r + 2]
        });
        this.coreImg.attr(attrs.core);
        this.scoreText.attr(attrs.coreScore);
        this.flagImg.attr(attrs.flag);
    }

    tick(animate = true, tickLink = true) {
        const chart = this.chart;
        const shape = this.getPicture();
        chart.updateShape(shape, {
            position: [this.x, this.y]
        }, animate);
        tickLink && chart.tick(this.getLinks());
    }

    selectMe() {
        this.set('selected', true);
        this.updatePicture(false);
    }

    unselectMe() {
        this.set('selected', false);
        this.updatePicture(false);
    }

    /**
     * 获取对方node的链接点
     * @param  {[Node]}        另一个 Node类
     * @param  {[Link]}              link信息,link.proxy 可以获取代理线的信息，从而可以方便的获取index，定制链接点
     * @return {[Vector]}            返回一个向量
     */
    getAnchorPoint(theOhterRenderable, link) {
        return;
    }

    getLinks() {
        const dataKeeper = this.chart.get('dataKeeper');
        const symbolKeeper = this.chart.get('symbolKeeper');
        const linksId = dataKeeper.get('graph').getNodeInfo(this.id).node.getLinksId();
        return symbolKeeper.getSymbolList(linksId);
    }
}

function _getShapeAttrs() {
    const chart = this.chart;
    const model = this.model;
    const userSetting = chart.get('userSetting');
    const { nodeSize = 23, fontSize = 12, showNodeName, showFlag, centerType, centerNodeSize, smallHidden, hiddenSocialBase, hiddenSocialCR } = userSetting.baseConfig;
    const options = userSetting[model.label] || userSetting.UNKOWN;
    const iconImage = options.fonticons[options.fonticon];
    let r;
    if (centerType && centerType.indexOf(model.label) !== -1) {
        r = centerNodeSize;
    } else {
        r = options.nodeSize || nodeSize;
    }
    const iconWidth = r * 2;
    const isSelected = this.get('selected');
    let labels = null;
    if (options.types && options.types.length && showFlag) {
        labels = _createLabels(options, model, r * 1.2);
    }
    const circle = {
        shape: {
            cx: 0,
            cy: 0,
            r: r
        },
    };

    let icon = null;
    let textFillShowSocial = isSelected ? '#e92003' : options.iconColor;
    let colorArr = [
        '#FF6565',
        '#FFAF46',
        '#8AD900',
        '#00CBD9',
        '#007CF9',
        '#6232C4',
        '#FF679A',
        '#7E5333',
        '#827059',
        '#B1AFA5',
        '#81BE8E',
        '#5E6F80',
        '#937EBF',
        '#FFA1C0',
        '#FF9E3D',
        '#B7CDFF',
        '#7289BE',
        '#56AAFF',
        '#42C5B1',
        '#FBCC5C',
        '#F34943',
        '#F1737C',
        '#6C757D',
        '#5050A1',
        '#7A7AFF',
        '#51C1D8',
        '#73BB6D',
        '#31CE77',
        '#4A5368',
    ];
    while (colorArr.length < 5000) {
        colorArr = colorArr.concat(colorArr);
    }
    // 设置社区的颜色，colorArr为30种颜色循环的数组,每一个颜色代表一个社区，社区值从0开始
    if (model['classify'] || model['classify'] === 0) {
        textFillShowSocial = colorArr[model['classify']];
    }
    if (iconImage) {
        icon = {
            style: {
                textFill: chart._cfg.el.getAttribute('id') === 'canvasImage' ? (!hiddenSocialBase ? textFillShowSocial : (isSelected ? '#e92003' : options.iconColor)) : (!hiddenSocialCR ? textFillShowSocial : (isSelected ? '#e92003' : options.iconColor)),
                text: iconImage.code + ' ',
                fontSize: iconWidth + 3,
                fontFamily: 'panguicon',
                x: -iconWidth / 2 - 1.5,
                y: -iconWidth / 2,
                textBackgroundColor: '#fff',
            },
            z: 6
        };
    }
    // 头像
    let image = null;
    if (model.zp) {
        image = {
            style: {
                x: -r,
                y: -r,
                width: iconWidth,
                height: iconWidth,
                image: 'data:image/png;base64,' + model.zp,
                shadowColor: isSelected ? 'red' : '#343434',
                shadowBlur: 2
            },
            z: 7
        };
    }

    /**
     * 核心节点
     * position: top /  rightTop
     * 用于计算位置
     * */
    let core = {
        style: {
            text: null
        }
    };
    if (model.core) {
        let { fontSize, iconColor, fonticon } = userSetting.HG;
        let coreImage = userSetting.HG.fonticons[fonticon];
        core = {
            position: [-fontSize / 2, -r - fontSize + fontSize * 0.3], // fontSize * 0.3 为icon下面的留白距离
            style: {
                textFill: iconColor,
                text: coreImage.code + ' ',
                fontSize: fontSize,
                fontFamily: 'panguicon',
                textBackgroundColor: 'transparent',
            },
            z: 8
        };
    }
    // 核心节点分数
    let coreScore = {
        style: {
            text: null
        }
    };
    if (model.showScore) {
        let { fontSize, scorePosition, color } = userSetting.baseConfig.coreScore;
        coreScore = {
            position: [scorePosition === 'left' ? -r - fontSize * 1.5 : r, -fontSize / 2],
            style: {
                fontSize,
                text: this.model.score || 0,
                textFill: color,
                fontWeight: 'bolder'
            },
            z: 8
        };
    }
    /**
     * 标签, 节点名称
     * */
    const content = chart.config('hideText') ? '' : options.text(model);
    const text = {
        style: {
            fontSize: options.fontSize || fontSize,
            text: !smallHidden ? (showNodeName ? content : '') : '',
            textPosition: 'bottom',
            textFill: isSelected ? '#e92003' : '#fff'
        },
        z: 5
    };
    /**
     * 标记
     * */
    let flag = {
        style: {
            text: null
        }
    };
    if (model.flag) {
        let { flagSize, iconColor, fonticon } = userSetting.BJ;
        let flagImage = userSetting.BJ.fonticons[fonticon];
        flag = {
            position: [r * Math.cos(Math.PI * 45 / 180) - flagSize / 2, -r * Math.sin(Math.PI * 45 / 180) - flagSize],
            style: {
                textFill: model.flagColor || iconColor,
                text: flagImage.code + ' ',
                fontSize: flagSize,
                fontFamily: 'panguicon',
                textBackgroundColor: 'transparent',
            },
            z: 6
        };
    }
    return {
        icon,
        circle,
        text,
        image,
        r,
        core,
        coreScore,
        labels,
        flag
    };
}

function _createLabels(options, model, r) {
    let types = options.types;
    let res = [];

    types.forEach(item => {
        if (model[item.hdzd]) {
            let option = options[item.use];
            let { position, nodeSize, fonticon, iconColor, show } = option;
            let p = _getPosition(r, position, nodeSize);
            let iconImage = option.fonticons[fonticon];
            let circle = {
                shape: {
                    cx: p.x,
                    cy: p.y,
                    r: show ? nodeSize : 0
                }
            };
            let icon = {
                style: {
                    textFill: iconColor,
                    text: show ? iconImage.code + ' ' : '',
                    fontSize: nodeSize * 2,
                    fontFamily: 'panguicon',
                    x: p.x - nodeSize,
                    y: p.y - nodeSize,
                    textBackgroundColor: '#fff',
                },
                z: 7
            };
            res.push({ circle, icon });
        }
    });

    return res;
}

function _getPosition(r, position, nodeSize) {
    let obj = {};
    switch (position) {
        case 'top':
            obj.x = 0;
            obj.y = -r;
            break;
        case 'left':
            obj.x = -r;
            obj.y = -nodeSize / 2;
            break;
        case 'right':
            obj.x = r;
            obj.y = -nodeSize / 2;
            break;
        case 'leftTop': // 45deg
            obj.x = -r * Math.cos(Math.PI * 45 / 180);
            obj.y = -r * Math.sin(Math.PI * 45 / 180);
            break;
        case 'rightTop':
            obj.x = r * Math.cos(Math.PI * 45 / 180);
            obj.y = -r * Math.sin(Math.PI * 45 / 180);
            break;
    }
    return obj;
}
