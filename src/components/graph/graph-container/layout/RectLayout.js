
/**
 * 对传入的数组对对象进行位置计算
 * @param {Array[obj]} objs 对象数组
 * @param {*} options 配置项
 */
export function rectLayout(objs, options) {
    if (!objs.length) {
        return;
    }
    options = {
        stepX: 100,
        stepY: 120,
        direction: 'vetical',
        cols: 0,
        originCenter: false,
        ...options
    };
    const cols = options.cols ? options.cols : Math.ceil(Math.sqrt(objs.length));
    const rows = Math.ceil(objs.length / cols);

    const offsetX = !options.originCenter ? 0 : -(cols + 1) * options.stepX / 2;
    const offsetY = !options.originCenter ? 0 : -(rows + 1) * options.stepY / 2;

    objs.forEach(function(obj, index) {
        const col = index % cols;
        const row = Math.ceil((index + 1) / cols);
        obj.x = options.stepX * col + offsetX;
        obj.y = options.stepY * row + offsetY;
    });
}