import { createInterface } from "node:readline/promises";
import { writeFile } from "node:fs/promises";
import type { Helyettesites } from "./helyettesites.ts";

const url = "https://retoolapi.dev/kYtwSU/data";
const rl = createInterface({ input: process.stdin, output: process.stdout });

function hiba(uzenet: string) {
  console.log("\x1b[33m" + uzenet + "\x1b[0m");
}

async function adatokLekerese(): Promise<Helyettesites[]> {
  const res = await fetch(url);
  return await res.json();
}

async function listazas() {
  const adatok = await adatokLekerese();
  if (adatok.length === 0) {
    console.log("Nincs adat.");
    return;
  }
  adatok.forEach((h, i) => {
    console.log(`${i + 1}. ${h.nev} - ${h.ora}. óra - ${h.hetNapja}`);
  });
}

async function ujAdat() {
  const nev = (await rl.question("Név: ")).trim();
  if (nev === "") {
    hiba("A név nem lehet üres!");
    return;
  }

  const oraSzoveg = (await rl.question("Óra: ")).trim();
  const ora = Number(oraSzoveg);
  if (oraSzoveg === "" || !Number.isInteger(ora)) {
    hiba("Az óra csak egész szám lehet!");
    return;
  }

  const hetNapja = (await rl.question("A hét napja: ")).trim();
  if (hetNapja === "") {
    hiba("A hét napja nem lehet üres!");
    return;
  }

  const pushResult = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nev, ora, hetNapja }),
  });
  if (pushResult.ok) {
    console.log("Sikeres felvétel.");
  } else {
    hiba("A szerver nem fogadta el az adatot.");
  }
}

async function torles() {
  const adatok = await adatokLekerese();
  await listazas();
  if (adatok.length === 0) return;

  const sorszam = Number((await rl.question("Törlendő sorszáma: ")).trim());
  const elem = adatok[sorszam - 1];
  if (!Number.isInteger(sorszam) || elem === undefined) {
    hiba("Ilyen sorszám nincs a listában!");
    return;
  }

  const deleteResult = await fetch(`${url}/${elem.id}`, { method: "DELETE" });
  if (deleteResult.ok) {
    console.log("Törölve.");
  } else {
    hiba("A törlés nem sikerült.");
  }
}

async function exportalas() {
  const adatok = await adatokLekerese();
  let fajlnev = (await rl.question("Fájlnév: ")).trim();
  if (fajlnev === "") fajlnev = "export";
  if (!fajlnev.endsWith(".json")) fajlnev += ".json";

  await writeFile(fajlnev, JSON.stringify(adatok, null, 2), "utf-8");
  console.log(`Mentve: ${fajlnev}`);
}

let kilep = false;
while (!kilep) {
  console.log("\n1 - Listázás");
  console.log("2 - Új adat");
  console.log("3 - Törlés");
  console.log("4 - Exportálás JSON-be");
  console.log("0 - Kilépés");
  const valasztas = (await rl.question("> ")).trim();

  try {
    if (valasztas === "1") await listazas();
    else if (valasztas === "2") await ujAdat();
    else if (valasztas === "3") await torles();
    else if (valasztas === "4") await exportalas();
    else if (valasztas === "0") kilep = true;
    else hiba("Nincs ilyen menüpont!");
  } catch {
    hiba("Hiba történt (a szerver nem elérhető?).");
  }
}
rl.close();
