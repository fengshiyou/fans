import { makeIconList, icons as fonticons } from '../panguicon';
import { makeSVGIconList } from '../svgicon';

const labelData = {};

// makeSVGIconList这个函数已经没有什么卵用
// 人
labelData.Person = {
    options: {
        svgicons: makeSVGIconList('人,人1'),
        fonticons: makeIconList('ren,round-user-new'),
    },
    config: {
        svgicon: 'default',
        fonticon: 'default',
        text: makeTextPicker('xm,ywxm,zym'),
        name: '人',
        iconColor: '#728ccb',
    }
};
// 手机
labelData.Phone = {
    options: {
        svgicons: makeSVGIconList('电话,电话1'),
        fonticons: {
            'default': fonticons['dianhua'],
            'icon1': fonticons['icontel'],
            'icon2': fonticons['dianhua-copy-copy-copy-copy']
        },
    },
    config: {
        svgicon: 'default',
        fonticon: 'default',
        text: makeTextPicker('phone'),
        name: '电话号码',
        iconColor: '#6cd091',
    }
};

labelData.UNKOWN = {
    options: {
        svgicons: makeSVGIconList('人,人1'),
        fonticons: makeIconList('weizhi,weizhi-')
    },
    config: {
        svgicon: 'default',
        fonticon: 'default',
        text: makeTextPicker('label', function(field, value) {
            return '未知内容：' + value;
        }, '未知内容'),
        name: '未知节点类型',
        iconColor: 'gray',
    }
};

const nodeSetting = {};
const nodeOptions = {};
for (let key in labelData) {
    if (labelData.hasOwnProperty(key)) {
        const labelSet = labelData[key];
        nodeSetting[key] = labelSet.config;
        nodeOptions[key] = labelSet.options;
    }
}

export { nodeOptions, nodeSetting };
export default labelData;

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
