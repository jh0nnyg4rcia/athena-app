import { TRILHA_DIA1_FONTE } from './trilha_dia1_fonte';

export interface TrilhaItem {
  dia: number;
  semana: number;
  paginas: string;
  materias: {
    nome: string;
    conteudo: string;
  }[];
  fonteCompleta?: string;
}

export const TRILHA_JURIDICA_DATA: TrilhaItem[] = [
  // SEMANA 1
  {
    dia: 1,
    semana: 1,
    paginas: "21 - 72",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 1º ao 4º" },
      { nome: "Código Penal", conteudo: "art. 1º ao 12" },
      { nome: "Código de Processo Civil", conteudo: "art. 1º ao 15" },
      { nome: "Código de Processo Penal", conteudo: "art. 1º ao 3º-F" },
      { nome: "DL 4657/42 (LINDB)", conteudo: "Completa" }
    ],
    fonteCompleta: TRILHA_DIA1_FONTE
  },
  {
    dia: 2,
    semana: 1,
    paginas: "74 - 125",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 5º" },
      { nome: "Código Civil", conteudo: "art. 1º ao 21" },
      { nome: "Código Penal", conteudo: "art. 13 ao 19" },
      { nome: "Código de Processo Civil", conteudo: "art. 16 ao 25" },
      { nome: "Código de Processo Penal", conteudo: "art. 4º ao 23" }
    ]
  },
  {
    dia: 3,
    semana: 1,
    paginas: "127 - 179",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 6º ao 13" },
      { nome: "Código Civil", conteudo: "art. 22 ao 52" },
      { nome: "Código Penal", conteudo: "art. 20 ao 31" },
      { nome: "Código de Processo Civil", conteudo: "art. 26 ao 63" },
      { nome: "Código de Processo Penal", conteudo: "art. 24 ao 62" }
    ]
  },
  {
    dia: 4,
    semana: 1,
    paginas: "181 - 227",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 14 ao 24" },
      { nome: "Código Civil", conteudo: "art. 53 ao 103" },
      { nome: "Código Penal", conteudo: "art. 32 ao 48" },
      { nome: "Código de Processo Civil", conteudo: "art. 64 ao 81" },
      { nome: "Código de Processo Penal", conteudo: "art. 63 ao 82" }
    ]
  },
  {
    dia: 5,
    semana: 1,
    paginas: "229 - 278",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 25 ao 36" },
      { nome: "Código Civil", conteudo: "art. 104 ao 165" },
      { nome: "Código Penal", conteudo: "art. 49 ao 63" },
      { nome: "Código de Processo Civil", conteudo: "art. 82 ao 97" },
      { nome: "Código de Processo Penal", conteudo: "art. 83 ao 94" }
    ]
  },
  {
    dia: 6,
    semana: 1,
    paginas: "280 - 334",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 37 e 38" },
      { nome: "Código Civil", conteudo: "art. 166 ao 196" },
      { nome: "Código Penal", conteudo: "art. 64 ao 69" },
      { nome: "Código de Processo Civil", conteudo: "art. 98 ao 102" },
      { nome: "Código de Processo Penal", conteudo: "art. 95 ao 144-A" }
    ]
  },
  {
    dia: 7,
    semana: 1,
    paginas: "336 - 399",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 39 ao 43" },
      { nome: "Código Civil", conteudo: "art. 197 ao 232" },
      { nome: "Código Penal", conteudo: "art. 70 ao 95" },
      { nome: "Código de Processo Civil", conteudo: "art. 103 ao 124" },
      { nome: "Código de Processo Penal", conteudo: "art. 145 ao 184" }
    ]
  },

  // SEMANA 2
  {
    dia: 8,
    semana: 2,
    paginas: "401 - 449",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 44 ao 57" },
      { nome: "Código Civil", conteudo: "art. 233 ao 285" },
      { nome: "Código Penal", conteudo: "art. 96 ao 120" },
      { nome: "Código de Processo Civil", conteudo: "art. 125 ao 138" },
      { nome: "Código de Processo Penal", conteudo: "art. 185 ao 225" }
    ]
  },
  {
    dia: 9,
    semana: 2,
    paginas: "451 - 507",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 58 ao 69" },
      { nome: "Código Civil", conteudo: "art. 286 ao 351" },
      { nome: "Código Penal", conteudo: "art. 121 ao 137" },
      { nome: "Código de Processo Civil", conteudo: "art. 139 ao 175" },
      { nome: "Código de Processo Penal", conteudo: "art. 226 ao 250" }
    ]
  },
  {
    dia: 10,
    semana: 2,
    paginas: "509 - 563",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 70 ao 86" },
      { nome: "Código Civil", conteudo: "art. 352 ao 407" },
      { nome: "Código Penal", conteudo: "art. 138 ao 150" },
      { nome: "Código de Processo Civil", conteudo: "art. 176 ao 235" },
      { nome: "Código de Processo Penal", conteudo: "art. 251 ao 281" }
    ]
  },
  {
    dia: 11,
    semana: 2,
    paginas: "565 - 607",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 87 ao 99" },
      { nome: "Código Civil", conteudo: "art. 408 ao 426" },
      { nome: "Código Penal", conteudo: "art. 151 ao 156" },
      { nome: "Código de Processo Civil", conteudo: "art. 236 ao 275" },
      { nome: "Código de Processo Penal", conteudo: "art. 282 ao 300" }
    ]
  },
  {
    dia: 12,
    semana: 2,
    paginas: "609 - 662",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 100 ao 103-B" },
      { nome: "Código Civil", conteudo: "art. 427 ao 475" },
      { nome: "Código Penal", conteudo: "art. 157 ao 160" },
      { nome: "Código de Processo Civil", conteudo: "art. 276 ao 310" },
      { nome: "Código de Processo Penal", conteudo: "art. 301 ao 310-A" }
    ]
  },
  {
    dia: 13,
    semana: 2,
    paginas: "664 - 716",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 104 ao 116" },
      { nome: "Código Civil", conteudo: "art. 476 ao 528" },
      { nome: "Código Penal", conteudo: "art. 161 ao 179" },
      { nome: "Código de Processo Civil", conteudo: "art. 311 ao 334" },
      { nome: "Código de Processo Penal", conteudo: "art. 311 ao 318-B" }
    ]
  },
  {
    dia: 14,
    semana: 2,
    paginas: "718 - 762",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 118 ao 130" },
      { nome: "Código Civil", conteudo: "art. 529 ao 578" },
      { nome: "Código Penal", conteudo: "art. 180 ao 207" },
      { nome: "Código de Processo Civil", conteudo: "art. 335 ao 353" },
      { nome: "Código de Processo Penal", conteudo: "art. 319 ao 369" }
    ]
  },

  // SEMANA 3
  {
    dia: 15,
    semana: 3,
    paginas: "764 - 811",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 131 ao 144" },
      { nome: "Código Civil", conteudo: "art. 579 ao 646" },
      { nome: "Código Penal", conteudo: "art. 208 ao 226" },
      { nome: "Código de Processo Civil", conteudo: "art. 354 ao 383" },
      { nome: "Código de Processo Penal", conteudo: "art. 370 ao 393" }
    ]
  },
  {
    dia: 16,
    semana: 3,
    paginas: "813 - 862",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 145 ao 149-C" },
      { nome: "Código Civil", conteudo: "art. 647 ao 709" },
      { nome: "Código Penal", conteudo: "art. 227 ao 249" },
      { nome: "Código de Processo Civil", conteudo: "art. 384 ao 449" },
      { nome: "Código de Processo Penal", conteudo: "art. 394 ao 421" }
    ]
  },
  {
    dia: 17,
    semana: 3,
    paginas: "864 - 904",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 150 ao 152" },
      { nome: "Código Civil", conteudo: "art. 710 ao 756" },
      { nome: "Código Penal", conteudo: "art. 250 ao 288-A" },
      { nome: "Código de Processo Civil", conteudo: "art. 450 ao 484" },
      { nome: "Código de Processo Penal", conteudo: "art. 422 ao 472" }
    ]
  },
  {
    dia: 18,
    semana: 3,
    paginas: "906 - 957",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 153 ao 155" },
      { nome: "Código Civil", conteudo: "art. 757 ao 853" },
      { nome: "Código Penal", conteudo: "art. 289 ao 311-A" },
      { nome: "Código de Processo Civil", conteudo: "art. 485 ao 501" },
      { nome: "Código de Processo Penal", conteudo: "art. 473 ao 518" }
    ]
  },
  {
    dia: 19,
    semana: 3,
    paginas: "959 - 1016",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 156 e 156-B" },
      { nome: "Código Civil", conteudo: "art. 853-A ao 920" },
      { nome: "Código Penal", conteudo: "art. 312 ao 337-A" },
      { nome: "Código de Processo Civil", conteudo: "art. 502 ao 527" },
      { nome: "Código de Processo Penal", conteudo: "art. 519 ao 573" }
    ]
  },
  {
    dia: 20,
    semana: 3,
    paginas: "1018 - 1064",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 157 ao 164-A" },
      { nome: "Código Civil", conteudo: "art. 921 ao 943" },
      { nome: "Código Penal", conteudo: "art. 337-B ao 337-P" },
      { nome: "Código de Processo Civil", conteudo: "art. 528 ao 553" },
      { nome: "Código de Processo Penal", conteudo: "art. 574 ao 592" }
    ]
  },
  {
    dia: 21,
    semana: 3,
    paginas: "1066 - 1113",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 165 ao 169" },
      { nome: "Código Civil", conteudo: "art. 944 ao 971" },
      { nome: "Código Penal", conteudo: "art. 338 ao 359" },
      { nome: "Código de Processo Civil", conteudo: "art. 554 ao 598" },
      { nome: "Código de Processo Penal", conteudo: "art. 593 ao 631" }
    ]
  },

  // SEMANA 4
  {
    dia: 22,
    semana: 4,
    paginas: "1115 - 1164",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 170 ao 191" },
      { nome: "Código Civil", conteudo: "art. 972 ao 1027" },
      { nome: "Código Penal", conteudo: "art. 359-A ao 359-H" },
      { nome: "Código de Processo Civil", conteudo: "art. 599 ao 658" },
      { nome: "Código de Processo Penal", conteudo: "art. 637 ao 667" }
    ]
  },
  {
    dia: 23,
    semana: 4,
    paginas: "1166 - 1214",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 193 ao 204" },
      { nome: "Código Civil", conteudo: "art. 1028 ao 1070" },
      { nome: "Código Penal", conteudo: "art. 359-I ao 359-T" },
      { nome: "Código de Processo Civil", conteudo: "art. 659 ao 702" },
      { nome: "Código de Processo Penal", conteudo: "art. 791 ao 809" },
      { nome: "Lei 4717/65", conteudo: "Ação Popular" }
    ]
  },
  {
    dia: 24,
    semana: 4,
    paginas: "1216 - 1255",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 205 ao 217" },
      { nome: "Código Civil", conteudo: "art. 1071 ao 1133" },
      { nome: "Código de Processo Civil", conteudo: "art. 703 ao 746" },
      { nome: "Lei 12562/11", conteudo: "Representação Interventiva" },
      { nome: "Lei 9507/97", conteudo: "Habeas Data" }
    ]
  },
  {
    dia: 25,
    semana: 4,
    paginas: "1257 - 1306",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 218 ao 225" },
      { nome: "Código Civil", conteudo: "art. 1134 ao 1178" },
      { nome: "Código de Processo Civil", conteudo: "art. 747 ao 782" },
      { nome: "Lei 7347/85", conteudo: "Ação Civil Pública" }
    ]
  },
  {
    dia: 26,
    semana: 4,
    paginas: "1308 - 1356",
    materias: [
      { nome: "Constituição Federal", conteudo: "art. 226 ao 250" },
      { nome: "Código Civil", conteudo: "art. 1179 ao 1203" },
      { nome: "Código de Processo Civil", conteudo: "art. 783 ao 830" },
      { nome: "Lei 11417/06", conteudo: "Súmula Vinculante" },
      { nome: "Lei 13300/16", conteudo: "Mandado de Injunção" },
      { nome: "Lei 1579/52", conteudo: "CPI" },
      { nome: "Lei 9882/99", conteudo: "ADPF" }
    ]
  },
  {
    dia: 27,
    semana: 4,
    paginas: "1358 - 1397",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1204 ao 1244" },
      { nome: "Código de Processo Civil", conteudo: "art. 831 ao 861" },
      { nome: "Lei 9868/99", conteudo: "ADI / ADC / ADO" }
    ]
  },
  {
    dia: 28,
    semana: 4,
    paginas: "1399 - 1437",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1245 ao 1285" },
      { nome: "Código de Processo Civil", conteudo: "art. 862 ao 909" },
      { nome: "Lei 12016/09", conteudo: "Mandado de Segurança" }
    ]
  },

  // SEMANA 5
  {
    dia: 29,
    semana: 5,
    paginas: "1439 - 1482",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1286 ao 1346" },
      { nome: "Código de Processo Civil", conteudo: "art. 910 ao 928" },
      { nome: "Lei 8987/95", conteudo: "Serviços Públicos" }
    ]
  },
  {
    dia: 30,
    semana: 5,
    paginas: "1484 - 1527",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1347 ao 1358-U" },
      { nome: "Código de Processo Civil", conteudo: "art. 929 ao 950" },
      { nome: "Lei 9784/99", conteudo: "Processo Administrativo" }
    ]
  },
  {
    dia: 31,
    semana: 5,
    paginas: "1529 - 1565",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1359 ao 1368-B" },
      { nome: "Código de Processo Civil", conteudo: "art. 951 ao 987" },
      { nome: "Decreto-Lei 25/37", conteudo: "Tombamento" },
      { nome: "Lei 11079/04", conteudo: "PPP - Parcerias Público-Privadas" }
    ]
  },
  {
    dia: 32,
    semana: 5,
    paginas: "1567 - 1608",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1368-C ao 1430" },
      { nome: "Código de Processo Civil", conteudo: "art. 988 ao 1008" },
      { nome: "DUDH", conteudo: "Completa" },
      { nome: "Lei 8429/92 (Improbidade)", conteudo: "art. 1º ao 13" }
    ]
  },
  {
    dia: 33,
    semana: 5,
    paginas: "1610 - 1654",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1431 ao 1501" },
      { nome: "Código de Processo Civil", conteudo: "art. 1009 ao 1020" },
      { nome: "Lei 8429/92 (Improbidade)", conteudo: "art. 14 ao 24" }
    ]
  },
  {
    dia: 34,
    semana: 5,
    paginas: "1656 - 1698",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1502 ao 1564" },
      { nome: "Código de Processo Civil", conteudo: "art. 1021 ao 1026" },
      { nome: "Decreto-Lei 3365/41", conteudo: "Desapropriação por Utilidade Pública" }
    ]
  },
  {
    dia: 35,
    semana: 5,
    paginas: "1700 - 1744",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1565 ao 1606" },
      { nome: "Código de Processo Civil", conteudo: "art. 1027 ao 1035" },
      { nome: "Lei 4132/62", conteudo: "Desapropriação por Interesse Social" },
      { nome: "Lei 9637/98", conteudo: "Organizações Sociais - OS" },
      { nome: "Lei 9790/99", conteudo: "OSCIP" }
    ]
  },

  // SEMANA 6
  {
    dia: 36,
    semana: 6,
    paginas: "1746 - 1785",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1607 ao 1686" },
      { nome: "Código de Processo Civil", conteudo: "art. 1036 ao 1044" },
      { nome: "Lei 13988/20", conteudo: "Transação Resolutiva de Litígio Tributário" }
    ]
  },
  {
    dia: 37,
    semana: 6,
    paginas: "1787 - 1831",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1687 ao 1722" },
      { nome: "Código de Processo Civil", conteudo: "art. 1045 ao 1072" },
      { nome: "LC 105/01", conteudo: "Sigilo das Operações Financeiras" },
      { nome: "Lei 12037/09", conteudo: "Identificação Criminal" },
      { nome: "Lei 13260/16", conteudo: "Antiterrorismo" },
      { nome: "Lei 14597/23", conteudo: "Lei Geral do Esporte - Ordem Econômica" }
    ]
  },
  {
    dia: 38,
    semana: 6,
    paginas: "1833 - 1873",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1723 ao 1783" },
      { nome: "Lei 11107/05", conteudo: "Consórcios Públicos" },
      { nome: "Lei 12846/13", conteudo: "Lei Anticorrupção" },
      { nome: "Lei 13303/16", conteudo: "Estatuto das Estatais - Parte I" }
    ]
  },
  {
    dia: 39,
    semana: 6,
    paginas: "1875 - 1917",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1784 ao 1844" },
      { nome: "Lei 13303/16", conteudo: "Estatuto das Estatais - Parte II" },
      { nome: "Lei 13848/19", conteudo: "Agências Reguladoras" }
    ]
  },
  {
    dia: 40,
    semana: 6,
    paginas: "1919 - 1955",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1845 ao 1922" },
      { nome: "Lei 13019/14", conteudo: "MROSC - Parcerias com OSC - Parte I" },
      { nome: "Lei 13303/16", conteudo: "Estatuto das Estatais - Parte III" }
    ]
  },
  {
    dia: 41,
    semana: 6,
    paginas: "1957 - 1996",
    materias: [
      { nome: "Código Civil", conteudo: "art. 1923 ao 2001" },
      { nome: "Lei 13019/14", conteudo: "MROSC - Parcerias com OSC - Conclusão" },
      { nome: "Lei 13460/17", conteudo: "Direito dos Usuários dos Serviços Públicos" },
      { nome: "Lei 9469/97", conteudo: "Intervenção da União em causas públicas" },
      { nome: "Resolução 378/06 CONAMA", conteudo: "Completa" }
    ]
  },
  {
    dia: 42,
    semana: 6,
    paginas: "1998 - 2044",
    materias: [
      { nome: "Código Civil", conteudo: "art. 2002 ao 2046" },
      { nome: "Lei 13140/15", conteudo: "Mediação na Administração Pública" },
      { nome: "Lei 14133/21 (Licitações)", conteudo: "art. 1º ao 17" },
      { nome: "Resolução 237/97 CONAMA", conteudo: "Completa" }
    ]
  },

  // SEMANA 7
  {
    dia: 43,
    semana: 7,
    paginas: "2046 - 2092",
    materias: [
      { nome: "Lei 14133/21 (Licitações)", conteudo: "art. 18 ao 58" },
      { nome: "Lei 9099/95", conteudo: "Juizados Especiais Cíveis" }
    ]
  },
  {
    dia: 44,
    semana: 7,
    paginas: "2094 - 2137",
    materias: [
      { nome: "Lei 14133/21 (Licitações)", conteudo: "art. 59 ao 86" },
      { nome: "Lei 9099/95", conteudo: "Juizados Especiais Criminais" }
    ]
  },
  {
    dia: 45,
    semana: 7,
    paginas: "2139 - 2179",
    materias: [
      { nome: "Lei 14133/21 (Licitações)", conteudo: "art. 87 ao 139" },
      { nome: "Lei 5478/68", conteudo: "Lei de Alimentos" },
      { nome: "Lei 8560/92", conteudo: "Investigação de Paternidade" },
      { nome: "Lei 11804/08", conteudo: "Alimentos Gravídicos" },
      { nome: "Lei 12153/09", conteudo: "Juizado Especial da Fazenda Pública" }
    ]
  },
  {
    dia: 46,
    semana: 7,
    paginas: "2181 - 2228",
    materias: [
      { nome: "Lei 14133/21 (Licitações)", conteudo: "art. 140 ao 194" },
      { nome: "Lei 8112/90 (Servidores)", conteudo: "art. 1º ao 96" }
    ]
  },
  {
    dia: 47,
    semana: 7,
    paginas: "2230 - 2262",
    materias: [
      { nome: "Lei 8112/90 (Servidores)", conteudo: "art. 97 ao 166" },
      { nome: "Lei 9613/98", conteudo: "Lavagem de Dinheiro" }
    ]
  },
  {
    dia: 48,
    semana: 7,
    paginas: "2264 - 2302",
    materias: [
      { nome: "Lei 8112/90 (Servidores)", conteudo: "art. 167 ao 250" },
      { nome: "Lei 12694/12", conteudo: "Julgamento Colegiado 1º Grau" },
      { nome: "Resolução 23/07 CNMP", conteudo: "Inquérito Civil" },
      { nome: "Resolução 82/12 CNMP", conteudo: "Audiências Públicas" }
    ]
  },
  {
    dia: 49,
    semana: 7,
    paginas: "2304 - 2342",
    materias: [
      { nome: "Lei 8038/90", conteudo: "Ação Penal Originária nos Tribunais" },
      { nome: "Lei 8072/90", conteudo: "Crimes Hediondos" },
      { nome: "Lei 9455/97", conteudo: "Lei de Tortura" },
      { nome: "Lei 12850/13", conteudo: "Organização Criminosa" }
    ]
  },

  // SEMANA 8
  {
    dia: 50,
    semana: 8,
    paginas: "2344 - 2391",
    materias: [
      { nome: "Lei 9296/96", conteudo: "Interceptação Telefônica" },
      { nome: "Lei 11340/06", conteudo: "Lei Maria da Penha" },
      { nome: "Lei 13869/19", conteudo: "Abuso de Autoridade" }
    ]
  },
  {
    dia: 51,
    semana: 8,
    paginas: "2393 - 2429",
    materias: [
      { nome: "Lei 7716/89", conteudo: "Crimes de Preconceito" },
      { nome: "Lei 9503/97", conteudo: "Crimes de Trânsito" },
      { nome: "Lei 10826/03", conteudo: "Estatuto do Desarmamento" }
    ]
  },
  {
    dia: 52,
    semana: 8,
    paginas: "2431 - 2473",
    materias: [
      { nome: "Lei 1521/51", conteudo: "Crimes Economia Popular" },
      { nome: "Lei 8137/90", conteudo: "Crimes Tributários e Econômicos" },
      { nome: "Lei 9605/98", conteudo: "Crimes Ambientais" },
      { nome: "Lei 9807/99", conteudo: "Proteção a Testemunhas" }
    ]
  },
  {
    dia: 53,
    semana: 8,
    paginas: "2475 - 2513",
    materias: [
      { nome: "Lei 7210/84 (LEP)", conteudo: "art. 1º ao 48" },
      { nome: "Lei 11343/06 (Drogas)", conteudo: "art. 1º ao 47" }
    ]
  },
  {
    dia: 54,
    semana: 8,
    paginas: "2515 - 2564",
    materias: [
      { nome: "Lei 7210/84 (LEP)", conteudo: "art. 49 ao 70" },
      { nome: "Lei 11343/06 (Drogas)", conteudo: "art. 48 ao 73" },
      { nome: "Lei 14344/22", conteudo: "Lei Henry Borel - Família" }
    ]
  },
  {
    dia: 55,
    semana: 8,
    paginas: "2566 - 2604",
    materias: [
      { nome: "Decreto-Lei 3688/41", conteudo: "Contravenções Penais" },
      { nome: "Lei 7210/84 (LEP)", conteudo: "art. 71 ao 121" },
      { nome: "Resolução 118/14 CNMP", conteudo: "Autocomposição" }
    ]
  },
  {
    dia: 56,
    semana: 8,
    paginas: "2606 - 2639",
    materias: [
      { nome: "Lei 7210/84 (LEP)", conteudo: "art. 122 ao 146-E" },
      { nome: "Lei 7960/89", conteudo: "Prisão Temporária" },
      { nome: "Lei 10216/01", conteudo: "Saúde Mental e Transtornos" },
      { nome: "Lei 13257/16", conteudo: "Marco Legal Primeira Infância" }
    ]
  },

  // SEMANA 9
  {
    dia: 57,
    semana: 9,
    paginas: "2641 - 2671",
    materias: [
      { nome: "Lei 7210/84 (LEP)", conteudo: "art. 147 ao 204" },
      { nome: "Lei 12318/10", conteudo: "Alienação Parental" },
      { nome: "Lei 13185/15", conteudo: "Combate ao Bullying" },
      { nome: "Resolução 164/17 CNMP", conteudo: "Recomendação" },
      { nome: "Resolução 179/17 CNMP", conteudo: "TAC - Ajustamento de Conduta" }
    ]
  },
  {
    dia: 58,
    semana: 9,
    paginas: "2673 - 2712",
    materias: [
      { nome: "CTN (Tributário)", conteudo: "art. 1º ao 82-A" },
      { nome: "Lei 13146/15 (PCD)", conteudo: "art. 1º ao 40" }
    ]
  },
  {
    dia: 59,
    semana: 9,
    paginas: "2714 - 2754",
    materias: [
      { nome: "CTN (Tributário)", conteudo: "art. 96 ao 156" },
      { nome: "Lei 13146/15 (PCD)", conteudo: "art. 41 ao 125" }
    ]
  },
  {
    dia: 60,
    semana: 9,
    paginas: "2756 - 2811",
    materias: [
      { nome: "CDC (Consumidor)", conteudo: "art. 1º ao 38" },
      { nome: "CTN (Tributário)", conteudo: "art. 157 ao 193" },
      { nome: "ECA (Direito da Criança)", conteudo: "art. 1º ao 38" }
    ]
  },
  {
    dia: 61,
    semana: 9,
    paginas: "2813 - 2853",
    materias: [
      { nome: "CDC (Consumidor)", conteudo: "art. 39 ao 80" },
      { nome: "CTN (Tributário)", conteudo: "art. 194 ao 218" },
      { nome: "ECA (Direito da Criança)", conteudo: "art. 39 ao 52-D" }
    ]
  },
  {
    dia: 62,
    semana: 9,
    paginas: "2855 - 2892",
    materias: [
      { nome: "CDC (Consumidor)", conteudo: "art. 81 ao 107" },
      { nome: "ECA (Direito da Criança)", conteudo: "art. 53 ao 94-A" }
    ]
  },
  {
    dia: 63,
    semana: 9,
    paginas: "2894 - 2931",
    materias: [
      { nome: "DL 201/67", conteudo: "Responsabilidade Prefeitos/Vereadores" },
      { nome: "ECA (Direito da Criança)", conteudo: "art. 95 ao 137" },
      { nome: "Lei 13431/17", conteudo: "Garantia Direitos Criança Vítima/Testemunha" }
    ]
  },
  {
    dia: 64,
    semana: 9,
    paginas: "2933 - 2974",
    materias: [
      { nome: "ECA (Direito da Criança)", conteudo: "art. 138 ao 199-E" },
      { nome: "Lei 12594/12", conteudo: "SINASE - Atendimento Socioeducativo" }
    ]
  },
  {
    dia: 65,
    semana: 9,
    paginas: "2976 - 3034",
    materias: [
      { nome: "ECA (Direito da Criança)", conteudo: "art. 200 ao 265-A" },
      { nome: "Lei 10741/03", conteudo: "Estatuto do Idoso" },
      { nome: "Resolução 237/97 CONAMA", conteudo: "Processos e Licenciamento" }
    ]
  },
  {
    dia: 66,
    semana: 9,
    paginas: "3036 - 3082",
    materias: [
      { nome: "Lei 8245/91", conteudo: "Lei do Inquilinato" },
      { nome: "Lei 9985/00", conteudo: "SNUC - Unidades de Conservação" }
    ]
  },
  {
    dia: 67,
    semana: 9,
    paginas: "3084 - 3119",
    materias: [
      { nome: "Código Florestal", conteudo: "art. 1º ao 40" },
      { nome: "LC 140/11", conteudo: "Competência Ambiental" }
    ]
  },

  // SEMANA 10
  {
    dia: 68,
    semana: 10,
    paginas: "3121 - 3170",
    materias: [
      { nome: "Código Florestal", conteudo: "art. 41 ao 75" },
      { nome: "Lei 6938/81", conteudo: "PNMA - Meio Ambiente" },
      { nome: "Lei 9433/97", conteudo: "Recursos Hídricos" }
    ]
  },
  {
    dia: 69,
    semana: 10,
    paginas: "3172 - 3219",
    materias: [
      { nome: "Lei 10257/01", conteudo: "Estatuto da Cidade" },
      { nome: "Lei 11445/07", conteudo: "Saneamento Básico" }
    ]
  },
  {
    dia: 70,
    semana: 10,
    paginas: "3221 - 3270",
    materias: [
      { nome: "Lei 6766/79", conteudo: "Parcelamento do Solo Urbano" },
      { nome: "Lei 8080/90", conteudo: "Lei Orgânica da Saúde / SUS" }
    ]
  },
  {
    dia: 71,
    semana: 10,
    paginas: "3272 - 3313",
    materias: [
      { nome: "Lei 9394/96 (LDB)", conteudo: "art. 1º ao 36-D" },
      { nome: "Lei 11101/05 (Falências)", conteudo: "art. 1º ao 46" }
    ]
  },
  {
    dia: 72,
    semana: 10,
    paginas: "3315 - 3349",
    materias: [
      { nome: "Lei 9394/96 (LDB)", conteudo: "art. 37 ao 90-A" },
      { nome: "Lei 11101/05 (Falências)", conteudo: "art. 47 ao 69" }
    ]
  },
  {
    dia: 73,
    semana: 10,
    paginas: "3351 - 3392",
    materias: [
      { nome: "Lei 11101/05 (Falências)", conteudo: "art. 69-A ao 107" },
      { nome: "Lei 13465/17", conteudo: "REURB - Regularização Fundiária" }
    ]
  },
  {
    dia: 74,
    semana: 10,
    paginas: "3394 - 3442",
    materias: [
      { nome: "Lei 11101/05 (Falências)", conteudo: "art. 108 ao 167-E" },
      { nome: "Lei 12187/09", conteudo: "PNMC - Mudança do Clima" },
      { nome: "Lei 12587/12", conteudo: "Mobilidade Urbana" },
      { nome: "Resolução 181/17 CNMP", conteudo: "Procedimento Investigatório Criminal" }
    ]
  },

  // SEMANA 11
  {
    dia: 75,
    semana: 11,
    paginas: "3444 - 3480",
    materias: [
      { nome: "Decreto 7053/09", conteudo: "População em Situação de Rua" },
      { nome: "Lei 11101/05 (Falências)", conteudo: "art. 167-F ao 199" },
      { nome: "Lei 11105/05", conteudo: "Lei de Biossegurança" }
    ]
  },
  {
    dia: 76,
    semana: 11,
    paginas: "3482 - 3519",
    materias: [
      { nome: "LC 24/75", conteudo: "Convênios de ICMS (CONFAZ)" },
      { nome: "LC 87/96", conteudo: "Lei Kandir - ICMS" },
      { nome: "Lei 7853/89", conteudo: "Apoio às PCDs" },
      { nome: "Lei 11419/06", conteudo: "Processo Eletrônico" }
    ]
  },
  {
    dia: 77,
    semana: 11,
    paginas: "3521 - 3560",
    materias: [
      { nome: "Lei 8742/93", conteudo: "LOAS - Assistência Social" },
      { nome: "Lei 12305/10", conteudo: "Resíduos Sólidos" }
    ]
  },
  {
    dia: 78,
    semana: 11,
    paginas: "3562 - 3603",
    materias: [
      { nome: "Lei 6015/73 (Registros)", conteudo: "art. 1º ao 126" }
    ]
  },
  {
    dia: 79,
    semana: 11,
    paginas: "3605 - 3654",
    materias: [
      { nome: "Lei 6015/73 (Registros)", conteudo: "art. 127 ao 299" }
    ]
  },
  {
    dia: 80,
    semana: 11,
    paginas: "3656 - 3685",
    materias: [
      { nome: "Lei 8009/90", conteudo: "Impenhorabilidade Bem de Família" },
      { nome: "Lei 12965/14", conteudo: "Marco Civil da Internet" }
    ]
  },
  {
    dia: 81,
    semana: 11,
    paginas: "3687 - 3721",
    materias: [
      { nome: "Código Eleitoral", conteudo: "art. 1º ao 24" },
      { nome: "Lei 6091/74", conteudo: "Transporte/Alimentação Eleições" },
      { nome: "Lei 12288/10", conteudo: "Igualdade Racial" }
    ]
  },

  // SEMANA 12
  {
    dia: 82,
    semana: 12,
    paginas: "3723 - 3758",
    materias: [
      { nome: "Código Eleitoral", conteudo: "art. 25 ao 81" },
      { nome: "Lei 12527/11", conteudo: "LAI - Acesso à Informação" }
    ]
  },
  {
    dia: 83,
    semana: 12,
    paginas: "3760 - 3800",
    materias: [
      { nome: "ADCT", conteudo: "art. 1º ao 72" },
      { nome: "Código Eleitoral", conteudo: "art. 82 ao 145" }
    ]
  },
  {
    dia: 84,
    semana: 12,
    paginas: "3802 - 3859",
    materias: [
      { nome: "ADCT", conteudo: "art. 73 ao 120" },
      { nome: "Código Eleitoral", conteudo: "art. 146 ao 214" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 1º ao 16-B" }
    ]
  },
  {
    dia: 85,
    semana: 12,
    paginas: "3861 - 3896",
    materias: [
      { nome: "Código Eleitoral", conteudo: "art. 215 ao 282" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 16-C ao 32" }
    ]
  },
  {
    dia: 86,
    semana: 12,
    paginas: "3898 - 3946",
    materias: [
      { nome: "Código Eleitoral", conteudo: "art. 283 ao 381" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 33 ao 41-A" },
      { nome: "Lei 13709/18 (LGPD)", conteudo: "art. 1º ao 22" }
    ]
  },
  {
    dia: 87,
    semana: 12,
    paginas: "3948 - 4003",
    materias: [
      { nome: "Lei 9096/95", conteudo: "Partidos Políticos" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 43 ao 57-J" },
      { nome: "Lei 13709/18 (LGPD)", conteudo: "art. 23 ao 65" }
    ]
  },
  {
    dia: 88,
    semana: 12,
    paginas: "4005 - 4033",
    materias: [
      { nome: "LC 64/90", conteudo: "Lei das Inelegibilidades" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 58 ao 78" }
    ]
  },

  // SEMANA 13
  {
    dia: 89,
    semana: 13,
    paginas: "4035 - 4069",
    materias: [
      { nome: "LC 75/93 (MPU)", conteudo: "art. 1º ao 92" },
      { nome: "Lei 9504/97 (Eleições)", conteudo: "art. 79 ao 105-A" }
    ]
  },
  {
    dia: 90,
    semana: 13,
    paginas: "4071 - 4101",
    materias: [
      { nome: "LC 75/93 (MPU)", conteudo: "art. 93 ao 171" },
      { nome: "Lei 8625/93 (LONMP)", conteudo: "art. 1º ao 35" }
    ]
  },
  {
    dia: 91,
    semana: 13,
    paginas: "4103 - 4138",
    materias: [
      { nome: "LC 75/93 (MPU)", conteudo: "art. 172 ao 295" },
      { nome: "Lei 8625/93 (LONMP)", conteudo: "art. 36 ao 82" }
    ]
  },
  {
    dia: 92,
    semana: 13,
    paginas: "4140 - 4191",
    materias: [
      { nome: "ADCT", conteudo: "Revisão Geral e Consolidação" }
    ]
  },
  {
    dia: 93,
    semana: 13,
    paginas: "4193 - 4229",
    materias: [
      { nome: "DL 911/69", conteudo: "Alienação Fiduciária Bens Móveis" },
      { nome: "Lei 8242/91", conteudo: "CONANDA" },
      { nome: "Lei 8437/92", conteudo: "Cautelares contra Poder Público" },
      { nome: "Lei 9494/97", conteudo: "Tutela antecipada contra Fazenda" },
      { nome: "Lei 9514/97", conteudo: "Fiduciária Bens Imóveis" },
      { nome: "Resolução 131/11 CNJ", conteudo: "Viagem Internacional Menor" },
      { nome: "Resolução 295/19 CNJ", conteudo: "Viagem Nacional Menor" }
    ]
  },
  {
    dia: 94,
    semana: 13,
    paginas: "4231 - 4267",
    materias: [
      { nome: "Lei 4737/65", conteudo: "Crimes Eleitorais" },
      { nome: "Resolução 154/16 CNMP", conteudo: "Completa" },
      { nome: "Resolução 228/21 CNMP", conteudo: "Completa" },
      { nome: "Resolução CONANDA 231/22", conteudo: "Conselho Tutelar" }
    ]
  },
  {
    dia: 95,
    semana: 13,
    paginas: "4269 - 4315",
    materias: [
      { nome: "Decreto 2181/97", conteudo: "SNDC - Consumidor" },
      { nome: "Decreto 9921/19", conteudo: "Pessoa Idosa" },
      { nome: "Lei 8842/94", conteudo: "Idoso / CNDI" },
      { nome: "Decreto 11150/22", conteudo: "Superendividamento" }
    ]
  },
  {
    dia: 96,
    semana: 14,
    paginas: "4317 - 4358",
    materias: [
      { nome: "Convenção Racismo", conteudo: "Interamericana" },
      { nome: "Convenção CDPD", conteudo: "Direitos PCD" },
      { nome: "Lei 8899/94", conteudo: "Passe Livre PCD" },
      { nome: "Lei 10098/00", conteudo: "Acessibilidade" },
      { nome: "Lei 12764/12", conteudo: "TEA Autismo" }
    ]
  },
  {
    dia: 97,
    semana: 14,
    paginas: "4360 - 4400",
    materias: [
      { nome: "Lei 7492/86", conteudo: "Crimes Sistema Financeiro" },
      { nome: "Lei 9795/99", conteudo: "Educação Ambiental" },
      { nome: "Lei 11124/05", conteudo: "SNHIS Habitação" },
      { nome: "Lei 12608/12", conteudo: "PNPDEC Defesa Civil" }
    ]
  },
  {
    dia: 98,
    semana: 14,
    paginas: "4402 - 4445",
    materias: [
      { nome: "Lei 15190/25", conteudo: "Lincenciamento Ambiental" },
      { nome: "Lei 15211/25", conteudo: "Estatuto Digital Criança/Adolescente" }
    ]
  },
  {
    dia: 99,
    semana: 14,
    paginas: "4447 - 4485",
    materias: [
      { nome: "Jurisprudência - STF", conteudo: "Precedentes de Controle de Constitucionalidade dos últimos 12 meses" },
      { nome: "Jurisprudência - STJ", conteudo: "Temas de Recursos Repetitivos estratégicos de Direito Civil e Processo Civil dos últimos 12 meses" },
      { nome: "Legislação Especial", conteudo: "Lei 14133/21 (Nova Lei de Licitações) - Súmulas correlatas do TCU e STF" }
    ]
  },
  {
    dia: 100,
    semana: 14,
    paginas: "4487 - 4515",
    materias: [
      { nome: "Revisão Geral do Edital", conteudo: "Consolidação de pontos críticos de Direito Constitucional, Administrativo, Penal e Processo Penal" },
      { nome: "Simulado de Elite", conteudo: "Revisão exaustiva de Súmulas Vinculantes do STF e Súmulas do STJ aplicativas" }
    ]
  }
];
