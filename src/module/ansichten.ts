// Modulansichten (NFR-08): Ein Modul meldet hier seine Arbeitsfläche an.
import type { Component } from 'svelte';
import type { AnsichtProps } from '../lib/module';
import type { ModulId } from '../lib/projekt';
import TabellenAnsicht from './tabellen/TabellenAnsicht.svelte';

export const ANSICHTEN: Partial<Record<ModulId, Component<AnsichtProps, {}, 'inhalt'>>> = {
  tabellen: TabellenAnsicht
};
