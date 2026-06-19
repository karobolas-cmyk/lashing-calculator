const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const frictionData = {
    "Plyfa / Plywood / Träflak": [
        { name: "Sågat trä / Träpall", mu: 0.45 },
        { name: "Hyvlat virke", mu: 0.30 },
        { name: "Plastpall", mu: 0.20 },
        { name: "Stålhäck", mu: 0.45 }
    ],
    "Räfflat aluminium": [
        { name: "Sågat trä / Träpall", mu: 0.40 },
        { name: "Hyvlat virke", mu: 0.25 },
        { name: "Plastpall", mu: 0.15 },
        { name: "Stålhäck", mu: 0.30 }
    ],
    "Rostfri stålplåt": [
        { name: "Sågat trä / Träpall", mu: 0.30 },
        { name: "Hyvlat virke", mu: 0.20 },
        { name: "Plastpall", mu: 0.15 },
        { name: "Stålhäck", mu: 0.20 }
    ],
    "Grov betongyta": [
        { name: "Sågade träreglar", mu: 0.70 }
    ],
    "Slät betongyta": [
        { name: "Sågade träreglar", mu: 0.55 }
    ],
    "Annat underlag (t.ex. med gummimatta)": [
        { name: "Generellt gummi-underlag", mu: 0.60 }
    ]
};

const baseLashingCapacity = {
    0.15: { sideways: 0.34, forward: 0.14, backward: 0.34 },
    0.20: { sideways: 0.53, forward: 0.20, backward: 0.53 },
    0.25: { sideways: 0.79, forward: 0.26, backward: 0.79 },
    0.30: { sideways: 1.20, forward: 0.34, backward: 1.20 },
    0.35: { sideways: 1.80, forward: 0.42, backward: 1.80 },
    0.40: { sideways: 3.20, forward: 0.53, backward: 3.20 },
    0.45: { sideways: 7.10, forward: 0.64, backward: 7.10 },
    0.50: { sideways: "ej glid", forward: 0.79, backward: "ej glid" },
    0.55: { sideways: "ej glid", forward: 0.96, backward: "ej glid" },
    0.60: { sideways: "ej glid", forward: 1.20, backward: "ej glid" },
    0.65: { sideways: "ej glid", forward: 1.50, backward: "ej glid" },
    0.70: { sideways: "ej glid", forward: 1.80, backward: "ej glid" }
};

app.get('/api/options', (req, res) => { res.json(frictionData); });

app.get('/api/lashing-table', (req, res) => {
    const tableArray = Object.keys(baseLashingCapacity).map(mu => {
        return {
            mu: parseFloat(mu),
            sideways: baseLashingCapacity[mu].sideways,
            forward: baseLashingCapacity[mu].forward,
            backward: baseLashingCapacity[mu].backward
        };
    });
    res.json(tableArray);
});

app.post('/api/calculate', (req, res) => {
    const { lashingType, mu, weight, stf, lc, angleRange } = req.body;
    
    if (!lashingType || mu === undefined || !weight || isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: "Felaktig inmatning" });
    }

    // --- BERÄKNING FÖR ÖVERFALLSSURRNING ---
    if (lashingType === "topOver") {
        if (!stf || isNaN(stf)) return res.status(400).json({ error: "Stf saknas" });
        const baseCapacity = baseLashingCapacity[mu];
        if (!baseCapacity) return res.status(400).json({ error: "Inget värde hittat" });

        // Stf-justeringen (t.ex. 1.00x eller 2.00x)
        let totalFactor = stf / 400;
        
        // TYA-regeln: Om vinkeln är flack (30-75) halveras spännbandets kapacitet (vilket i förlängningen dubblerar antalet band)
        if (angleRange === "flat") {
            totalFactor = totalFactor * 0.5;
        }

        const countStraps = (baseDirCap) => {
            if (baseDirCap === "ej glid") return 0;
            return Math.ceil(weight / (baseDirCap * totalFactor));
        };

        const sidewaysStraps = countStraps(baseCapacity.sideways);
        const forwardStraps = countStraps(baseCapacity.forward);
        const backwardStraps = countStraps(baseCapacity.backward);

        let total = Math.max(sidewaysStraps, forwardStraps, backwardStraps);
        if (total < 2) total = 2; // Minst 2 band enligt TYA:s branschnorm för grundstabilitet

        return res.json({
            lashingType: "topOver",
            mu, 
            factor: totalFactor.toFixed(2),
            rawForward: baseCapacity.forward, 
            calculatedSideways: baseCapacity.sideways === "ej glid" ? "ej glid" : (baseCapacity.sideways * totalFactor).toFixed(2),
            calculatedForward: (baseCapacity.forward * totalFactor).toFixed(2),
            calculatedBackward: baseCapacity.backward === "ej glid" ? "ej glid" : (baseCapacity.backward * totalFactor).toFixed(2),
            total: total
        });
    } 

    // --- BERÄKNING FÖR DIREKTSURRNING ---
    if (lashingType === "direct") {
        if (!lc || isNaN(lc)) return res.status(400).json({ error: "LC saknas" });
        const lcInTons = lc / 1000; 
        
        const forceRequiredForward = Math.max(0, (0.8 - mu) * weight);
        const forceRequiredSideways = Math.max(0, (0.5 - mu) * weight);
        const forceRequiredBackward = Math.max(0, (0.5 - mu) * weight);

        // Schablonvärde för direktsurrningens vinkelkoefficient (ca 45 graders geometri)
        const angleModifier = angleRange === "flat" ? 0.50 : 0.70;
        const capPerStrap = lcInTons * angleModifier; 

        const forward = forceRequiredForward === 0 ? 0 : Math.ceil(forceRequiredForward / capPerStrap);
        const sideways = forceRequiredSideways === 0 ? 0 : Math.ceil(forceRequiredSideways / capPerStrap);
        const backward = forceRequiredBackward === 0 ? 0 : Math.ceil(forceRequiredBackward / capPerStrap);
        
        let total = Math.max(forward, sideways, backward);
        if (total > 0 && total % 2 !== 0) total += 1; 

        return res.json({
            lashingType: "direct",
            mu, 
            factor: "N/A",
            calculatedSideways: forceRequiredSideways === 0 ? "friktion" : capPerStrap.toFixed(2),
            calculatedForward: capPerStrap.toFixed(2),
            calculatedBackward: forceRequiredBackward === 0 ? "friktion" : capPerStrap.toFixed(2),
            total: total < 2 ? 2 : total
        });
    }

    res.status(400).json({ error: "Okänd surrningstyp" });
});

app.listen(PORT, () => { console.log(`Servern körs på http://localhost:${PORT}`); });