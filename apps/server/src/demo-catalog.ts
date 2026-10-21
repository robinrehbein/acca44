export interface DemoProduct { slug: string; name: string; brand: string; category: 'schuhe'|'taschen'|'guertel'; price: number; colors: string[]; sizes: string[] }
/** Fictional model names and demo prices. No representation of current brand catalogues. */
export const demoCatalog: DemoProduct[] = [
    { slug:'kamo-gutsu-riva',name:'Riva',brand:'Kamo-Gutsu',category:'schuhe',price:18900,colors:['sand','blau'],sizes:['40','41','42','43'] },
    { slug:'kamo-gutsu-porto',name:'Porto',brand:'Kamo-Gutsu',category:'schuhe',price:19900,colors:['weiss','gruen'],sizes:['39','40','41','42'] },
    { slug:'kamo-gutsu-lido',name:'Lido',brand:'Kamo-Gutsu',category:'schuhe',price:17900,colors:['beige'],sizes:['37','38','39','40'] },
    { slug:'kamo-gutsu-monte',name:'Monte',brand:'Kamo-Gutsu',category:'schuhe',price:21900,colors:['braun'],sizes:['41','42','43','44'] },
    { slug:'satorisan-seebrise',name:'Seebrise',brand:'Satorisan',category:'schuhe',price:14900,colors:['gruen','sand'],sizes:['38','39','40','41'] },
    { slug:'satorisan-ufer',name:'Ufer',brand:'Satorisan',category:'schuhe',price:15900,colors:['blau'],sizes:['40','41','42','43'] },
    { slug:'satorisan-waldpfad',name:'Waldpfad',brand:'Satorisan',category:'schuhe',price:16900,colors:['braun','gruen'],sizes:['39','40','41','42'] },
    { slug:'satorisan-morgenlicht',name:'Morgenlicht',brand:'Satorisan',category:'schuhe',price:13900,colors:['weiss'],sizes:['36','37','38','39'] },
    { slug:'acca-tasche-hafen',name:'Hafen Tasche',brand:'ACCA44 Demo',category:'taschen',price:12900,colors:['braun','schwarz'],sizes:['one-size'] },
    { slug:'acca-tasche-promenade',name:'Promenade Tasche',brand:'ACCA44 Demo',category:'taschen',price:9900,colors:['sand'],sizes:['one-size'] },
    { slug:'acca-guertel-klassik',name:'Klassik Gürtel',brand:'ACCA44 Demo',category:'guertel',price:5900,colors:['braun','schwarz'],sizes:['85','95','105'] },
    { slug:'acca-guertel-geflecht',name:'Geflecht Gürtel',brand:'ACCA44 Demo',category:'guertel',price:6900,colors:['beige'],sizes:['85','95','105'] },
];
export const code = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
