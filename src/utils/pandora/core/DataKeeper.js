export default class DataKeeper {
    constructor() {
        this.current = {};
        this.snapshot = [];
    }

    get(name) {
        return this.current[name];
    }

    set(name, controller) {
        return (this.current[name] = controller);
    }

    takeSnap(name) {
        this.snapshot.push({
            name,
            snapshot: {
                ...this.current
            }
        });
    }

    restoreSnap(name) {
        const snapshot = this.clearSnaps(name);
        if (snapshot) {
            const current = this.current;
            this.current = snapshot;
            return current;
        }
        return null;
    }

    getSnap(name) {
        const snap = this.snapshot.find(s => s.name === name);
        return snap ? snap.snapshot : null;
    }

    clearSnaps(name) {
        if (name !== undefined || name !== null) {
            const snapshot = this.snapshot;
            const snapIndex = snapshot.findIndex(s => s.name === name);
            if (snapIndex > -1) {
                const snap = snapshot.splice(snapIndex, 1).pop();
                return snap.snapshot;
            }
            return null;
        }
        const shots = this.snapshot;
        this.snapshot = [];
        return shots;
    }
}
