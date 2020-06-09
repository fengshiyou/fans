import EventEmitter from "events";
import util from "../../util";
import Base from "./Base";

export default class EventfulBase extends Base {
    destroy() {
        super.destroy();
        this.removeAllListeners();
    }
}

util.extend(EventfulBase.prototype, EventEmitter.prototype);
