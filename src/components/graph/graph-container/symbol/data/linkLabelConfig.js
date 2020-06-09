
const labelData = {};
export default labelData;

labelData.Allcall = {
    'label': 'Allcall',
    'chinese': '通话',
    'config': {
        'color': '',
        'text': '通话'
    }
};

labelData.Unknown = {
    'label': 'Unknown',
    'chinese': '未知关系',
    'config': {
        'color': '',
        'text': function (model) {
            return '未知关系：' + model.type;
        }
    }
};
