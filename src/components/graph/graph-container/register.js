import pandora from 'pandora';
import PanCanvas from './behaviors/pancanvas';
import ZoomCanvas from './behaviors/zoomCanvas';
import ContextMenu from './behaviors/contextmenu';
import CircleNode from './symbol/CircleNode';
import Link from './symbol/Link';
import Selection from './behaviors/selection';
import Resize from './behaviors/resize';
import MouseMove from './behaviors/mouseMove';

import React from 'react';
import ReactDOM from 'react-dom';
// import PanguNodeMenu from '../sub_nodesBtn';
// import PanguLinkMenu from '../sub_linksBtn';
// import PanguStageMenu from '../sub_stageBtn';
// import PanguNodeHoverMenu from '../sub_nodesHoverBtn';
// import linkDetailFieldsMap from '../sub_linksBtn/columns/index';

pandora.registerBehavior('PanCanvas', PanCanvas);
pandora.registerBehavior('ZoomCanvas', ZoomCanvas);
pandora.registerBehavior('ContextMenu', ContextMenu);
pandora.registerBehavior('Selection', Selection);
pandora.registerBehavior('Resize', Resize);
pandora.registerBehavior('MouseMove', MouseMove);

// const detailLinkLabelList = Object.keys(linkDetailFieldsMap);
// detailLinkLabelList.push('Maintain'); // for test

pandora.config.defaultBehavior = [
    {
        name: 'PanCanvas'
    },
    {
        name: 'ZoomCanvas'
    },
    {
        name: 'ContextMenu',
        // test(target, chart, symbol, evt) {
        //     if (!target || !symbol) {
        //         return true;
        //     }
        //     // if (symbol instanceof Link) {
        //     //     return detailLinkLabelList.includes(symbol.model.type);
        //     // }
        //     return true;
        // },
        // render(overlay, chart, symbol, evt) {
        //     const menuBehavior = chart.getBehavior('ContextMenu');
        //     const Menu = !symbol ? PanguStageMenu : (symbol instanceof CircleNode) ? PanguNodeMenu : PanguLinkMenu;
        //     ReactDOM.render(<Menu graph={chart} node={symbol && symbol.model} data={symbol && symbol.model} event={evt} close={() => menuBehavior.closeMenu(overlay)}></Menu>, overlay.element.node());
        // },
        // destroy(overlay) {
        //     ReactDOM.render('', overlay.node());
        // }
    }, {
        name: 'Selection',
        working: false
    },
    {
        name: 'MouseMove',
        // test(target, chart, symbol, evt) {
        //     if (!target || !symbol) {
        //         return true;
        //     }
        //     // if (symbol instanceof Link) {
        //     //     return detailLinkLabelList.includes(symbol.model.type);
        //     // }
        //     return true;
        // },
        // render(overlay, chart, symbol, evt) {
        //     const menuBehavior = chart.getBehavior('MouseMove');
        //     const Menu = !symbol ? null : PanguNodeHoverMenu;
        //     if (Menu) {
        //         ReactDOM.render(<Menu graph={chart} node={symbol && symbol.model} data={symbol && symbol.model} event={evt} close={() => menuBehavior.closeMenu(overlay)}></Menu>, overlay.element.node());
        //     }
        // },
        // destroy(overlay) {
        //     ReactDOM.render('', overlay.node());
        // },
        working: false
    },
    'Resize'
];
