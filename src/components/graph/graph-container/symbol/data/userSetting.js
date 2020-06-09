import { makeIconList, icons as fonticons } from '../panguicon';

const userSetting = {
    baseConfig: {
        coreScore: { // 核心节点分数
            scorePosition: 'right', // 支持left、right
            fontSize: 14,
            color: 'red',
            showScore: false, // 是否显示核心节点分数
        },
        smallHidden: false, // 控制在缩小到某个值时是否隐藏某些元素，并且在还原时不影响原来的设置
        nodeSize: 14, // 普通节点大小
        fontSize: 12,  // 普通文字大小
        maxNode: 32, // 用于计算节点之间的距离
        lineWidth: 1,
        lineColor: '#4A90E2',
        mergeSide: true, // 是否合并关系显示
        margin: 5, // 合边之后两文字之间的距离
        showFlag: true, // 是否显示标签
        showNodeName: true, // 节点名称显示
        showRelation: true, // 关系类型显示
        showHeaderImage: false, // 显示头像
        centerType: 'Person,Phone', // 视觉中心，例如：Person、Phone等，多个类型之间用'-'分割
        centerNodeSize: 32, // 例如以人为中心， 人的大小为32， 其它的为nodeSize
    }
};

/**
 * 人的配置
 * 默认使用的图标， 更改时把fonticon:'default'改为fonticon:'icon1、2、3'即可
 * makeIconList('ren,round-user-new，ren1，ren2')生成对应图标
 * fonticons: {
            'default': fonticons['dianhua'],
            'icon1': fonticons['icontel'],
            'icon2': fonticons['icontel'],
            'icon3': fonticons['dianhua-copy-copy-copy-copy']
        }
 * */
userSetting.Person = {
    fonticon: 'default', // 选中的图标,
    iconColor: '#728ccb', // 图标的颜色
    fonticons: makeIconList('ren,round-user-new,ren1,ren2'), // 人的图标， 据产品透露， 应该是四个
    borderWidth: '', // 不是图标的边框，是用于剪缺图标的circle, 下同
    borderColor: '',
    text: makeTextPicker('xm,ywxm,zym'),
    name: '人'
};

// 手机
userSetting.Phone = {
    fonticons: {
        'default': fonticons['dianhua'],
        'icon1': fonticons['17'],
        'icon2': fonticons['dianhua1'],
        'icon3': fonticons['tell']
    },
    fonticon: 'default',
    text: makeTextPicker('phone'),
    name: '电话号码',
    iconColor: '#6cd091'
};

/**
 * 标记，和业务无关， 用于自定义
 * */
userSetting.BJ = {
    fonticon: 'water',
    iconColor: 'red',
    flagSize: 24,
    fonticons: {
        'water': fonticons['biaoji'],
        'compass': fonticons['tansuofaxian']
    }
};

/**
 * 皇冠，和业务无关， 用于自定义
 * */
userSetting.HG = {
    fonticon: 'default',
    iconColor: 'red',
    fontSize: 24,
    fonticons: {
        'default': fonticons['toushi']
    }
};

userSetting.UNKOWN = {
    fonticon: 'default',
    text: makeTextPicker('label', function(field, value) {
        return '未知内容：' + value;
    }, '未知内容'),
    name: '未知节点类型',
    iconColor: 'gray',
    fonticons: makeIconList('weizhi,weizhi-')
};

export { userSetting };

/**
 * 对后端返回的垃圾字段进行过滤
 * */
function makeTextPicker(fields, filter, defaultText = '') {
    fields = fields.split(/[,>]/);
    if (typeof filter === 'string') {
        defaultText = filter;
        filter = null;
    }
    return function(model) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (model.hasOwnProperty(field) && model[field] != null) {
                const value = model[field];
                return filter ? filter(field, value) : value;
            }
        }
        return defaultText;
    };
}
