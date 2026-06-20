const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Complete Friction Coefficient Matrix (mu) - Restored, Upgraded & Fully Bilingual
const frictionData = {
    "Formplywood / Slitdurk (Standard släpvagnsbotten)": {
        en: "Trailer Plywood / Anti-slip Deck (Standard Bed)",
        items: [
            { name_sv: "Sågat trä / Träpall mot släpvagnsbotten", name_en: "Sawn wood / wooden pallet to trailer bed", mu: 0.45 },
            { name_sv: "Hyvlat virke mot släpvagnsbotten", name_en: "Planed timber to trailer bed", mu: 0.30 },
            { name_sv: "Flyttlåda (Kartong) mot släpvagnsbotten", name_en: "Cardboard box to trailer bed", mu: 0.40 },
            { name_sv: "Storsäck (Plast) mot släpvagnsbotten", name_en: "Big bag (Plastic) to trailer bed", mu: 0.40 },
            { name_sv: "Plastback / Plastpall mot släpvagnsbotten", name_en: "Plastic bin / plastic pallet to trailer bed", mu: 0.20 },
            { name_sv: "Stålhäck / Maskindelar mot släpvagnsbotten", name_en: "Steel cage / machinery to trailer bed", mu: 0.45 }
        ]
    },
    "Räfflad aluminium / Durkplåt (Aluminium)": {
        en: "Ribbed Aluminum / Checker Plate",
        items: [
            { name_sv: "Sågat trä / Träpall mot räfflad aluminium", name_en: "Sawn wood / wooden pallet to checker plate", mu: 0.40 },
            { name_sv: "Hyvlat virke mot räfflad aluminium", name_en: "Planed timber to checker plate", mu: 0.25 },
            { name_sv: "Plastback / Plastpall mot räfflad aluminium", name_en: "Plastic bin / plastic pallet to checker plate", mu: 0.15 },
            { name_sv: "Stålhäck / Maskindelar mot räfflad aluminium", name_en: "Steel cage / machinery to checker plate", mu: 0.30 }
        ]
    },
    "Slät plåtbotten (Galvaniserat stål / Aluminium)": {
        en: "Smooth Metal Bed (Galvanized Steel / Aluminum)",
        items: [
            { name_sv: "Sågat trä / Träpall mot slät plåtbotten", name_en: "Sawn wood / wooden pallet to smooth metal bed", mu: 0.30 },
            { name_sv: "Hyvlat virke mot slät plåtbotten", name_en: "Planed timber to smooth metal bed", mu: 0.20 },
            { name_sv: "Plastback / Plastpall mot slät plåtbotten", name_en: "Plastic bin / plastic pallet to smooth metal bed", mu: 0.15 },
            { name_sv: "Slät stålplåt mot slät stålplåt (t.ex. maskindelar)", name_en: "Smooth steel to smooth steel bed", mu: 0.20 },
            { name_sv: "Målad stålplåt mot målad stålplåt", name_en: "Painted steel to painted steel bed", mu: 0.20 }
        ]
    },
    "Gummimatta / Friktionsduk (Rekommenderas!)": {
        en: "Rubber Mat / Friction Liner (Recommended!)",
        items: [
            { name_sv: "Alla typer av gods ovanpå gummimatta", name_en: "All cargo types on top of rubber mat", mu: 0.60 }
        ]
    },
    "Betong & Grova ytor": {
        en: "Concrete & Rough Surfaces",
        items: [
            { name_sv: "Grov betongyta mot träregel/pall", name_en: "Rough concrete surface to wood batten/pallet", mu: 0.70 },
            { name_sv: "Slät betongyta mot träregel/pall", name_en: "Smooth concrete surface to wood batten/pallet", mu: 0.55 }
        ]
    }
};

// Complete Sliding reference capacity chart (p.12)
const baseLashingCapacity = {
    "0.15": { sideways: 0.31,  forward: 0.15,  backward: 0.31 },
    "0.2":   { sideways: 0.48,  forward: 0.21,  backward: 0.48 },
    "0.25": { sideways: 0.72,  forward: 0.29,  backward: 0.72 },
    "0.3":   { sideways: 1.1,   forward: 0.38,  backward: 1.1 },
    "0.35": { sideways: 1.7,   forward: 0.49,  backward: 1.7 },
    "0.4":   { sideways: 2.9,   forward: 0.63,  backward: 2.9 },
    "0.45": { sideways: 6.4,   forward: 0.81,  backward: 6.4 },
    "0.5":   { sideways: "ej glid", forward: 1.1,   backward: "ej glid" },
    "0.55": { sideways: "ej glid", forward: 1.4,   backward: "ej glid" },
    "0.6":   { sideways: "ej glid", forward: 1.9,   backward: "ej glid" },
    "0.65": { sideways: "ej glid", forward: 2.7,   backward: "ej glid" },
    "0.7":   { sideways: "ej glid", forward: 4.4,   backward: "ej glid" }
};

// Sideways Tipping matrix (p.13)
const tippingSidewaysTable = {
    0.6: { 1: "ej tipp", 2: "ej tipp", 3: "ej tipp", 4: 5.8,  5: 2.9 },
    0.8: { 1: "ej tipp", 2: "ej tipp", 3: 4.9,       4: 2.1,  5: 1.5 },
    1.0: { 1: "ej tipp", 2: "ej tipp", 3: 2.2,       4: 1.3,  5: 0.97 },
    1.2: { 1: "ej tipp", 2: 4.1,       3: 1.4,       4: 0.91, 5: 0.73 },
    1.4: { 1: "ej tipp", 2: 2.3,       3: 0.99,      4: 0.71, 5: 0.58 },
    1.6: { 1: "ej tipp", 2: 1.5,       3: 0.78,      4: 0.58, 5: 0.49 },
    1.8: { 1: "ej tipp", 2: 1.1,       3: 0.64,      4: 0.49, 5: 0.42 },
    2.0: { 1: "ej tipp", 2: 0.90,      3: 0.54,      4: 0.42, 5: 0.36 },
    2.2: { 1: 4.5,       2: 0.75,      3: 0.47,      4: 0.37, 5: 0.32 },
    2.4: { 1: 3.3,       2: 0.64,      3: 0.42,      4: 0.33, 5: 0.29 },
    2.6: { 1: 2.4,       2: 0.56,      3: 0.37,      4: 0.30, 5: 0.26 },
    2.8: { 1: 1.8,       2: 0.50,      3: 0.34,      4: 0.28, 5: 0.24 },
    3.0: { 1: 1.4,       2: 0.45,      3: 0.31,      4: 0.25, 5: 0.22 },
    3.2: { 1: 1.2,       2: 0.41,      3: 0.29,      4: 0.24, 5: 0.21 }
};

// Longitudinal Tipping matrix (p.13)
const tippingForwardBackwardTable = {
    0.6: { forward: "ej tipp", backward: "ej tipp" },
    0.8: { forward: "ej tipp", backward: "ej tipp" },
    1.0: { forward: "ej tipp", backward: "ej tipp" },
    1.2: { forward: "ej tipp", backward: "ej tipp" },
    1.4: { forward: 5.3,       backward: "ej tipp" },
    1.6: { forward: 2.3,       backward: "ej tipp" },
    1.8: { forward: 1.4,       backward: "ej tipp" },
    2.0: { forward: 1.1,       backward: "ej tipp" },
    2.2: { forward: 0.83,      backward: 7.2 },
    2.4: { forward: 0.68,      backward: 3.6 },
    2.6: { forward: 0.58,      backward: 2.4 },
    2.8: { forward: 0.51,      backward: 1.8 },
    3.0: { forward: 0.45,      backward: 1.4 },
    3.2: { forward: 0.40,      backward: 1.2 }
};

function findClosestTippingKey(ratio, table) {
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    let matchedNum = keys[keys.length - 1]; 
    for (let key of keys) {
        if (ratio <= key) { matchedNum = key; break; }
    }
    return matchedNum % 1 === 0 ? matchedNum.toString() : matchedNum.toFixed(1);
}

app.get('/api/options', (req, res) => { res.json(frictionData); });

app.get('/api/lashing-table', (req, res) => {
    const slidingRows = Object.keys(baseLashingCapacity).map(muKey => ({
        mu: parseFloat(muKey),
        sideways: baseLashingCapacity[muKey].sideways,
        forward: baseLashingCapacity[muKey].forward,
        backward: baseLashingCapacity[muKey].backward
    }));
    res.json({ sliding: slidingRows, tippingSideways: tippingSidewaysTable, tippingForwardBackward: tippingForwardBackwardTable });
});

app.post('/api/calculate', (req, res) => {
    try {
        const { lashingType, mu, weight, stf, lc, angleRange, height, width, length, rows } = req.body;
        
        if (!lashingType || !weight || isNaN(weight) || weight <= 0) {
            return res.status(400).json({ error: "Felaktig inmatning av vikten" });
        }

        let parsedMu = parseFloat(mu);
        if (isNaN(parsedMu)) parsedMu = 0.20; 
        parsedMu = Math.round(parsedMu * 100) / 100;

        const availableMuKeys = Object.keys(baseLashingCapacity).map(Number).sort((a, b) => b - a);
        let matchedMu = availableMuKeys.find(k => parsedMu >= k) || 0.15;
        
        let baseCapacity = baseLashingCapacity[matchedMu.toString()] || baseLashingCapacity[matchedMu.toFixed(2)];

        if (!baseCapacity) {
            return res.status(400).json({ error: "Kunde inte matcha friktionskoefficienten mot TYA-tabellen" });
        }

        if (lashingType === "topOver") {
            if (!stf || isNaN(stf)) return res.status(400).json({ error: "Stf saknas" });
            let totalFactor = stf / 400;
            if (angleRange === "flat") totalFactor = totalFactor * 0.5;

            const countSlidingStraps = (baseCap) => {
                if (baseCap === "ej glid" || baseCap === 0) return 0;
                return Math.ceil(weight / (baseCap * totalFactor));
            };

            const slidingSideways = countSlidingStraps(baseCapacity.sideways);
            const slidingForward = countSlidingStraps(baseCapacity.forward);
            const slidingBackward = countSlidingStraps(baseCapacity.backward);

            let tippingSideways = 0, tippingForward = 0, tippingBackward = 0, isTippingCalculated = false;

            if (height && width && length) {
                isTippingCalculated = true;
                const hbRatio = height / width;
                const hlRatio = height / length;
                const activeRows = rows ? Math.min(5, Math.max(1, parseInt(rows))) : 1;

                let sideKey = findClosestTippingKey(hbRatio, tippingSidewaysTable);
                let longKey = findClosestTippingKey(hlRatio, tippingForwardBackwardTable);

                const sideRow = tippingSidewaysTable[sideKey] || {};
                const longRow = tippingForwardBackwardTable[longKey] || {};

                const baseTipSide = sideRow[activeRows];
                const baseTipForward = longRow.forward;
                const baseTipBackward = longRow.backward;

                const countTippingStraps = (baseTipCap) => {
                    if (baseTipCap === "ej tipp" || !baseTipCap) return 0;
                    return Math.ceil(weight / (baseTipCap * totalFactor));
                };

                // Säkring mot extrema kvoter utanför TYA-tabellens tak (> 3.2)
                if (hbRatio > 3.2) {
                    tippingSideways = Math.max(4, Math.ceil(weight / 0.15)); 
                } else {
                    tippingSideways = countTippingStraps(baseTipSide);
                }

                if (hlRatio > 3.2) {
                    tippingForward = Math.max(4, Math.ceil(weight / 0.15));
                    tippingBackward = Math.max(4, Math.ceil(weight / 0.15));
                } else {
                    tippingForward = countTippingStraps(baseTipForward);
                    tippingBackward = countTippingStraps(baseTipBackward);
                }
            }

            const finalSideways = Math.max(slidingSideways, tippingSideways);
            const finalForward = Math.max(slidingForward, tippingForward);
            const finalBackward = Math.max(slidingBackward, tippingBackward);

            let total = Math.max(finalSideways, finalForward, finalBackward);
            if (total < 2) total = 2; 

            return res.json({
                lashingType: "topOver", mu: parsedMu, factor: totalFactor.toFixed(2), isTippingCalculated,
                rawForward: baseCapacity.forward, calculatedSideways: baseCapacity.sideways, calculatedForward: baseCapacity.forward, calculatedBackward: baseCapacity.backward,
                sliding: { sideways: slidingSideways, forward: slidingForward, backward: slidingBackward }, 
                tipping: { sideways: tippingSideways, forward: tippingForward, backward: tippingBackward }, 
                total: total
            });
        }

        if (lashingType === "direct") {
            if (!lc || isNaN(lc)) return res.status(400).json({ error: "LC saknas" });
            const lcInTons = lc / 1000; 
            
            const forceRequiredForward = Math.max(0, (0.8 - parsedMu) * weight);
            const forceRequiredSideways = Math.max(0, (0.5 - parsedMu) * weight);
            const forceRequiredBackward = Math.max(0, (0.5 - parsedMu) * weight);

            const angleModifier = angleRange === "flat" ? 0.50 : 0.70;
            const capPerStrap = lcInTons * angleModifier; 

            const forward = forceRequiredForward === 0 ? 0 : Math.ceil(forceRequiredForward / capPerStrap);
            const sideways = forceRequiredSideways === 0 ? 0 : Math.ceil(forceRequiredSideways / capPerStrap);
            const backward = forceRequiredBackward === 0 ? 0 : Math.ceil(forceRequiredBackward / capPerStrap);
            
            let total = Math.max(forward, sideways, backward);
            if (total > 0 && total % 2 !== 0) total += 1; 

            return res.json({
                lashingType: "direct", mu: parsedMu, factor: "N/A",
                calculatedSideways: forceRequiredSideways === 0 ? "friktion" : capPerStrap.toFixed(2), calculatedForward: capPerStrap.toFixed(2), calculatedBackward: forceRequiredBackward === 0 ? "friktion" : capPerStrap.toFixed(2),
                total: total < 2 ? 2 : total
            });
        }
        res.status(400).json({ error: "Okänd surrningstyp" });
    } catch (serverError) {
        console.error("Kalkylatorkrasch fångad:", serverError);
        res.status(500).json({ error: "Ett internt serverfel uppstod vid beräkningen." });
    }
});

app.listen(PORT, () => { console.log(`Servern körs på port ${PORT}`); });