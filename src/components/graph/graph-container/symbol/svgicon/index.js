import icons from './icons';
import { Base64 } from 'js-base64';
export function buildImage(icon) {

}

export function makeSVGIconList(iconslist) {
    iconslist = iconslist.split(',');
    return iconslist.reduce(function(iconObj, icon, index) {
        const key = index === 0 ? 'default' : `icon${index}`;
        iconObj[key] = icons[icon];
        return iconObj;
    }, {});
}
export { icons };