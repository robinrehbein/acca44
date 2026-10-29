export interface DemoProduct {
    slug: string; name: string; category: 'schuhe'; price: number;
    colors: string[]; sizes: string[]; description: string; stockPerStore: Record<string, number>;
}
/** Supplied counts apply separately to each store. */
export const demoCatalog: DemoProduct[] = [
    { slug:'w1122', name:'W1122 Calf Nero', category:'schuhe', price:25900, colors:['Nero'], sizes:['38','39','40','41'], description:'Kalbsleder, ledergefüttert.', stockPerStore:{'38':2,'39':2,'40':2,'41':1} },
    { slug:'w1150', name:'W1150 RAG Grafite', category:'schuhe', price:25900, colors:['Grafite'], sizes:['37','38','39','40','41'], description:'Lammnappa, ledergefüttert.', stockPerStore:{'37':1,'38':2,'39':2,'40':1,'41':1} },
    { slug:'w1181', name:'W1181 Calif caffé', category:'schuhe', price:25900, colors:['caffé'], sizes:['37','38','39'], description:'Kalbsleder, ledergefüttert.', stockPerStore:{'37':1,'38':1,'39':2} },
    { slug:'w1160', name:'W1160 Crust brandy', category:'schuhe', price:24900, colors:['brandy'], sizes:['36'], description:'Kalbsleder, ledergefüttert. Letztes Paar je Filiale.', stockPerStore:{'36':1} },
    { slug:'w373', name:'W373 Calif Nero', category:'schuhe', price:23900, colors:['Nero'], sizes:['38'], description:'Letztes Paar je Filiale.', stockPerStore:{'38':1} },
    { slug:'w1164', name:'W1164 Crust Bruno', category:'schuhe', price:26900, colors:['Bruno'], sizes:['37','38','39','40'], description:'Kalbsleder mit Lammfellfutter.', stockPerStore:{'37':1,'38':1,'39':2,'40':2} },
];
export const code = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
