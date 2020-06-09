import pandora from 'pandora';
import linkLabelConfig from './data/linkLabelConfig';
import { transform } from '../util';
import { graphic } from 'echarts/lib/echarts';
const Symbol = pandora.interface.Symbol;
const Vector = pandora.Vector;

export default class Link extends Symbol {
    constructor(model, setting = {}) {
        super(model.id);
        const { sourceId, targetId } = setting;
        if (!sourceId || !targetId) {
            throw new Error('sourceId and targetId must needed');
        }
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.model = model;
        this.proxy = null;
    }

    updatePicture() {
        const attrs = _getAttrs.call(this);
        this.dart.attr(attrs.dart);
        this.line.attr(attrs.line);
        this.textRect.attr(attrs.textRect);
        this.textGroup.attr(attrs.textGroup);
    }

    drawPicture() {
        const chart = this.chart;
        let Engine = chart.get('zrender');
        const attrs = _getAttrs.call(this);
        const group = new Engine.Group(attrs.root);
        this.dart = new Engine.Polygon(attrs.dart);
        this.line = new Engine.BezierCurve(attrs.line);

        this.text = new Engine.Text(attrs.text);
        _setTextRect(attrs.textRect, this.text);
        const textOrigin = [attrs.textRect.shape.width / 2, attrs.textRect.shape.height / 2];
        attrs.textGroup.origin = textOrigin;

        this.textRect = new Engine.Rect(attrs.textRect);
        this.textGroup = new Engine.Group(attrs.textGroup);

        this.textGroup.add(this.textRect);
        this.textGroup.add(this.text);

        group.add(this.dart);
        group.add(this.line);
        group.add(this.textGroup);
        group.on('mouseover', evt => {
            const symbolKeeper = this.chart.get('symbolKeeper');
            const symbolSourceGroup = symbolKeeper.getSymbol(this.sourceId).group;
            const symbolTargetGroup = symbolKeeper.getSymbol(this.targetId).group;
            this.chart.updateShape(this.text, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.textGroup, {
                scale: [2, 2]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.textRect, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.line, {
                scale: [1, 4]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.dart, {
                scale: [4, 4]
            }, false, {
                time: 100
            });
            this.chart.updateShape(symbolSourceGroup, {
                scale: [2, 2]
            }, false, {
                time: 100
            });
            this.chart.updateShape(symbolTargetGroup, {
                scale: [2, 2]
            }, false, {
                time: 100
            });
        });
        group.on('mouseout', evt => {
            const symbolKeeper = this.chart.get('symbolKeeper');
            const symbolSourceGroup = symbolKeeper.getSymbol(this.sourceId).group;
            const symbolTargetGroup = symbolKeeper.getSymbol(this.targetId).group;
            this.chart.updateShape(this.text, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.textGroup, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.textRect, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.line, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(this.dart, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(symbolSourceGroup, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
            this.chart.updateShape(symbolTargetGroup, {
                scale: [1, 1]
            }, false, {
                time: 100
            });
        });
        return group;
    }

    tick() {
        const shape = this.getPicture();
        const attrs = _getAttrs.call(this);
        if (!attrs) {
            console.log('attrs', attrs);
            return;
        }
        shape.attr(attrs.root);
        this.dart.attr(attrs.dart);
        this.line.attr(attrs.line);
        this.textRect.attr(attrs.textRect);
        this.text.attr(attrs.text);

        const textBoundingRect = this.textGroup.getBoundingRect();
        const textCenter = new Vector(textBoundingRect.width / 2, textBoundingRect.height / 2);
        let textGroupPosition;
        let { mergeLength, mergeIndex } = attrs.textOffset;
        if (mergeLength > 0 && attrs.allLinks > 1) {
            const userSetting = this.chart.get('userSetting');
            const { margin } = userSetting.baseConfig;
            const offsetX = _getPositionOffset.call(this, attrs.textOffset);
            // 3个以下的居中， 其它的不处理
            if (attrs.allLinks === 2) {
                let offX = 0;
                textGroupPosition = this.line.pointAt(0.5);
                // 反向
                if (mergeLength === 1) {
                    offX = textGroupPosition[0] - offsetX + margin / 2;
                } else {
                    textGroupPosition = this.line.pointAt(0.3);
                    offX = textGroupPosition[0] + offsetX;
                }
                attrs.textGroup.position = [offX, textGroupPosition[1] - textCenter.y];
            } else if (attrs.allLinks === 3) {
                let offX = 0;
                // 三条线同方向
                if (mergeLength === 3 || mergeLength === 0) {
                    textGroupPosition = this.line.pointAt(0.2);
                    offX = textGroupPosition[0] + offsetX;
                }
                if (mergeLength === 1) {
                    textGroupPosition = this.line.pointAt(0.6);
                    offX = textGroupPosition[0];
                }
                if (mergeLength === 2) {
                    textGroupPosition = this.line.pointAt(0.4);
                    offX = textGroupPosition[0] + offsetX + margin;
                }
                attrs.textGroup.position = [offX, textGroupPosition[1] - textCenter.y];
            } else {
                textGroupPosition = this.line.pointAt(0.1);
                attrs.textGroup.position = [textGroupPosition[0] + offsetX, textGroupPosition[1] - textCenter.y];
            }
        } else {
            textGroupPosition = this.line.pointAt(0.5);
            attrs.textGroup.position = [textGroupPosition[0] - textCenter.x, textGroupPosition[1] - textCenter.y];
        }
        this.textGroup.attr(attrs.textGroup);
    }

    getAnother(otherId) {
        if (!this.isInLink(otherId)) {
            return;
        }
        return this.sourceId === otherId ? this.targetId : this.sourceId;
    }

    // 检测节点是否属于该边连接
    isInLink(nodeId) {
        return nodeId === this.sourceId || nodeId === this.tartgetId;
    }

    // 获取两个节点位置的坐标
    getPoints() {
        const sourceNode = this.keeper.getSymbol(this.sourceId);
        const targetNode = this.keeper.getSymbol(this.targetId);
        return [new Vector(sourceNode), new Vector(targetNode)];
    }

    // 获取线两端节点的挂载点，节点会互相根据对方是什么节点和线序号给定锚点位置.（虽然节点那边并没有实现这个方法LOL，框架设计大，就是还坑大无法妹时间取实现）
    getAnchorPoints() {
        const source = this.keeper.getSymbol(this.sourceId);
        const target = this.keeper.getSymbol(this.targetId);
        const sourcePoint = source.getAnchorPoint(target, this) || new Vector(source);
        const targetPoint = target.getAnchorPoint(source, this) || new Vector(target);

        return [sourcePoint, targetPoint];
    }
    selectMe() {
        this.selected = true;
        const linkGroup = getCurrentLinkGroup(this.chart, this.sourceId, this.targetId);
        linkGroup && this.tick();
    }
    unselectMe() {
        this.selected = false;
        const linkGroup = getCurrentLinkGroup(this.chart, this.sourceId, this.targetId);
        linkGroup && this.tick();
    }
    // 获取从source 到 target 的向量，基于挂载点
    getVector() {
        const [sourcePoint, targetPoint] = this.getAnchorPoints();
        return Vector.sub(targetPoint, sourcePoint);
    }
}

function _getAttrs() {
    const chart = this.chart;
    const model = this.model;
    const userSetting = chart.get('userSetting');
    if (!userSetting) {
        return;
    }
    let { nodeSize = 23, fontSize = 12, lineWidth = 1, lineColor = '#4A90E2', mergeSide, showRelation, centerType, centerNodeSize, smallHidden, hiddenSocialBase, hiddenSocialCR } = userSetting.baseConfig;
    const isSelfLink = this.sourceId === this.targetId;
    const linkGroup = getCurrentLinkGroup(this.chart, this.sourceId, this.targetId);
    if (!linkGroup) {
        return;
    }
    let bezierControlIndex = getBezierPosition(linkGroup, this.id);
    let textOffset = {};
    if (mergeSide) {
        textOffset.mergeIndex = this.model.mergeIndex || 0;
        textOffset.mergeLength = this.model.types && this.model.types.length || 1;
        textOffset.mergeTypes = this.model.types || [];
    }
    const point = this.getVector();
    const length = isSelfLink ? 200 : point.getLength();
    const halfLength = length / 2;
    const archOffsetYunit = mergeSide ? 0 : 5;
    const archOffsetX = nodeSize + 1;
    const archOffsetY = bezierControlIndex * archOffsetYunit;
    const sourceLabel = this.keeper.getSymbol(this.sourceId).model.label;
    const targetLabel = this.keeper.getSymbol(this.targetId).model.label;
    const archOffsetXStart = (centerType && centerType.indexOf(sourceLabel) !== -1) ? centerNodeSize : (userSetting[sourceLabel].nodeSize || archOffsetX);
    const archOffsetXEnd = (centerType && centerType.indexOf(targetLabel) !== -1) ? centerNodeSize : (userSetting[targetLabel].nodeSize || archOffsetX);
    const lineStartPoint = new Vector(archOffsetXStart, archOffsetY);
    const lineEndPoint = new Vector(length - archOffsetXEnd, archOffsetY);

    const verticalGutter = mergeSide ? 0 : linkGroup.__cache.hasCenterLine ? 40 : 20;
    const baseGutter = isSelfLink ? 80 : 0;
    const bezierControlPosition = baseGutter * (bezierControlIndex > 0 ? 1 : -1) + bezierControlIndex * verticalGutter;

    const controlPoint = new Vector(halfLength, bezierControlPosition);

    const sourceNode = this.keeper.getSymbol(this.sourceId);
    const groupRotation = isSelfLink ? 0 : -point.getDeg();

    if (isSelfLink) {
        lineStartPoint.x -= halfLength;
        lineEndPoint.x -= halfLength;
        controlPoint.x -= halfLength;
    }

    const rootGroupAttr = {
        position: [sourceNode.x, sourceNode.y],
        rotation: groupRotation
    };

    let strokeShowSocial = lineColor;
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
        strokeShowSocial = colorArr[model['classify']];
    }
    // 提取超级关系里面data字段的类型和分值
    const transform = (model) => {
        let val = model.data;
        if (val) {
            // 对象数组排序
            let sorterBy = (name, type) => (o, p) => {
                let a; let b;
                if (typeof o === 'object' && typeof p === 'object' && o && p) {
                    a = o[name];
                    b = p[name];
                    if (typeof a === 'object') {
                        // 如果传入的排序数据是对象，要先取到值再进行排序
                        return;
                    }
                    if (typeof a === 'number') {
                        if (type === 'down') {
                            return b - a;
                        } else {
                            return a - b;
                        }
                    } else {
                        if (type === 'down') {
                            if (a < b) {
                                return 1;
                            } else if (a > b) {
                                return -1;
                            } else {
                                return 0;
                            }
                        } else {
                            if (a < b) {
                                return -1;
                            } else if (a > b) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }
                    }
                }
            };
            let splitTypeArr = (types, score) => {
                let newTypes = new Set(types.split(','));
                let typesArr = Array.from(newTypes).map((obj) => {
                    return linkLabelConfig[obj] && linkLabelConfig[obj].config.text || '';
                });
                return {
                    types: typesArr.join('，'),
                    score: score
                };
            };
            let arr = val.split(';');
            let newArr = [];
            arr.forEach((item, index) => {
                let obj = Object.assign({}, item.split('-'));
                newArr.push(obj);
            });
            newArr.sort((a, b) => sorterBy(3, 'down')(a, b));
            return splitTypeArr(newArr[0][0], newArr[0][2]);
        } else {
            return '-';
        }
    };
    // 对分值进行非线性转换，0-20内的分值转换为0-15的宽度值，20-100的分值转换为16-20的宽度值
    const transformScore = (score) => {
        return Math.max(20 * (2 / (1 + Math.exp(-0.1 * score)) - 1), 1);
    };
    // console.log('score', transformScore(Number(transform(model).score)));
    // 线条
    const lineShapeAttr = {
        silent: true,
        shape: {
            x1: lineStartPoint.x,
            y1: lineStartPoint.y,
            x2: lineEndPoint.x,
            y2: lineEndPoint.y,
            cpx1: controlPoint.x,
            cpy1: controlPoint.y
        },
        style: {
            stroke: chart._cfg.el.getAttribute('id') === 'canvasImage' ? (!hiddenSocialBase ? strokeShowSocial : lineColor) : (!hiddenSocialCR ? strokeShowSocial : lineColor),
            opacity: this.selected ? 0.8 : 0.3,
            // lineWidth: this.selected ? lineWidth * 2 : lineWidth
            lineWidth: Number(transform(model).score) >= 0 ? transformScore(Number(transform(model).score)) : lineWidth
        },
        z: -1
    };

    // 箭头
    const dartShapeAttr = {
        position: Vector.add(lineEndPoint, new Vector(2, 0)).toArray(),
        invisible: isSelfLink,
        shape: {
            points: [[-10, 5], [0, 0], [-10, -5], [-8, 0]]
        },
        style: {
            fill: chart._cfg.el.getAttribute('id') === 'canvasImage' ? (!hiddenSocialBase ? strokeShowSocial : lineColor) : (!hiddenSocialCR ? strokeShowSocial : lineColor)
        },
        z: -1
    };

    const textGroupAttr = {
        rotation: Math.abs(groupRotation) > (Math.PI / 2) ? Math.PI : 0,
    };
    const typeConfig = linkLabelConfig[this.model.type] || linkLabelConfig.Unknown;
    const textContent = typeof typeConfig.config.text === 'function' ? (this.model.type !== 'super_related' ? typeConfig.config.text(this.model) : transform(this.model).types) : typeConfig.config.text;
    // 判断是否显示时优先判断是否有缩小隐藏，节点缩小到某个值时会将smallHidden设置为true，这是不显示内容。若需在缩小时显示，需在设置时将smallHidden设置为false
    const textRectAttr = {
        style: {
            fill: !smallHidden ? (showRelation ? (this.selected ? 'transparent' : 'transparent') : 'transparent') : 'transparent',
        }
    };

    const textAttr = {
        style: {
            text: !smallHidden ? (showRelation ? (chart.config('hideText') ? '' : textContent) : '') : '',
            textPosition: 'inside',
            textFill: !smallHidden ? (showRelation ? (this.selected ? '#e92003' : '#fff') : 'transparent') : 'transparent',
            fontSize
        },
        z: 2
    };
    return {
        root: rootGroupAttr,
        line: lineShapeAttr,
        dart: dartShapeAttr,
        textRect: textRectAttr,
        text: textAttr,
        textGroup: textGroupAttr,
        allLinks: linkGroup.links.length,
        textOffset
    };
}

function _setTextRect(rectAttr, text) {
    const textBoundingRect = text.getBoundingRect();
    const padding = textBoundingRect.lineHeight / 4;
    rectAttr.shape = {
        x: 0,
        y: 0,
        width: textBoundingRect.width + padding * 2,
        height: textBoundingRect.height + padding * 2,
    };
    text.attr({
        position: [padding, padding]
    });
}


function getCurrentLinkGroup(chart, sourceId, targetId) {
    const info = chart.get('dataKeeper').get('graph').getLinkInfo(sourceId, targetId);
    return info ? info.link : null;
}

function getBezierPosition(linkGroup, linkid) {
    const positionInfo = linkGroup.get('positionInfo', computePosInfo);
    return positionInfo[linkid];
}


function computePosInfo() {
    const linkGroup = this;
    const info = {};
    const links = linkGroup.links;
    const isOdd = links.length % 2 === 1;
    const isSelfLink = linkGroup.sourceId === linkGroup.targetId;

    if (linkGroup.links.length === 1 && !isSelfLink) {
        const link = links[0];
        info[link.id] = 0;
        return info;
    }
    const sourceToTarget = linkGroup.sourceToTarget;
    const targetToSource = linkGroup.targetToSource;
    // 所有的边都是朝同一个方向的，基数条边就放一条在中间，其他分布在两侧
    if (!sourceToTarget.length || !targetToSource.length || isSelfLink) {
        links.reduce(function(info, link, index) {
            if (isOdd && !isSelfLink) {
                if (index === 0) {
                    info[link.id] = 0;
                    linkGroup.__cache.hasCenterLine = true;
                    return info;
                }
                index -= 1;
            }
            const indexOdd = index % 2 === 1;
            const pos = Math.ceil((index + 1) / 2);
            info[link.id] = indexOdd ? -pos : pos;
            return info;
        }, info);
        return info;
    }
    // 双向的链接都有，则分别分布在两侧，中间不分布
    sourceToTarget.reduce(function(info, link, index) {
        info[link.id] = index + 1;
        return info;
    }, info);
    targetToSource.reduce(function(info, link, index) {
        info[link.id] = index + 1;
        return info;
    }, info);
    return info;
}

function getType(obj) {
    if (!obj) {
        return;
    }
    for (let key in obj) {
        return key;
    }
}

function _getPositionOffset(attrs) {
    let { mergeIndex, mergeTypes } = attrs;
    const userSetting = this.chart.get('userSetting');
    const { fontSize, margin } = userSetting.baseConfig;
    let offset = 0;
    for (let i = 0; i < mergeIndex; i++) {
        let typeConfig = linkLabelConfig[mergeTypes[i]] || linkLabelConfig.Unknown;
        let textContent = typeof typeConfig.config.text === 'function' ? typeConfig.config.text(this.model) : typeConfig.config.text;
        offset += fontSize * textContent.length + margin + fontSize / 2;
    }

    return offset;
}
