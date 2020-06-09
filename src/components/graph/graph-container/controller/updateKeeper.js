import CircleNode from '../symbol/CircleNode';
import Link from '../symbol/Link';
import pandora from 'pandora';
const objectId = pandora.util.objectId;

export default function updateKeeper({ nodes, links }, keeper) {
    const chart = this;
    keeper.enter(links)(function(enterLinks, existLinks) {
        return enterLinks.map(function(link) {
            return new Link(link, {
                sourceId: link.startId,
                targetId: link.endId
            });
        });
    });

    keeper.enter(nodes)(function(nodes) {
        return nodes.map(function(node) {
            return new CircleNode(node, node.option);
        });
    });
}