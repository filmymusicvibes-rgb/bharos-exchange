import { db } from "./firebase"
import { doc, updateDoc } from "firebase/firestore"

export const updateTokenPhase = async (totalUsers: number) => {

    let phase = "Phase 1"
    let price = 0.005
    let usersTarget = 1000

    if (totalUsers >= 1000) {
        phase = "Phase 2"
        price = 0.02
        usersTarget = 5000
    }

    if (totalUsers >= 5000) {
        phase = "Phase 3"
        price = 0.10
        usersTarget = 20000
    }

    if (totalUsers >= 20000) {
        phase = "Phase 4"
        price = 0.55
        usersTarget = 100000
    }

    await updateDoc(doc(db, "config", "token"), {
        phase: phase,
        price: price,
        usersTarget: usersTarget
    })

}