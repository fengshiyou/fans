import DataKeeper from "../DataKeeper";
import SymbolKeeper from "../SymbolKeeper";

const Mixin = {
    INIT: "_initData",

    CFG: {
        dataKeeper: null,
        symbolKeeper: null
    },

    mixin: {
        _initData() {
            const dataKeeper = new DataKeeper(this);
            const symbolKeeper = new SymbolKeeper(this);
            this.setAll({
                dataKeeper,
                symbolKeeper
            });
        },

        restore(restore) {
            if (restore) {
                this.setAll(restore);
                return this;
            }
            return {
                dataKeeper: this.get("dataKeeper"),
                shapeKeeper: this.get("symbolKeeper")
            };
        }
    }
};
export default Mixin;
