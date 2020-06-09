export function v4Style(selection, obj) {
    for (let key in obj) {
        obj.hasOwnProperty(key) && selection.style(key, obj[key]);
    }
}
