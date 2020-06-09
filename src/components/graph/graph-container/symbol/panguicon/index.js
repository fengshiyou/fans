import icons from './iconfont';

export function makeIconList(iconList) {
    iconList = iconList.split(',');
    return iconList.reduce(function(iconObj, icon, index) {
        const key = index === 0 ? 'default' : `icon${index}`;
        iconObj[key] = icons[icon];
        return iconObj;
    }, {});
}
export { icons };
