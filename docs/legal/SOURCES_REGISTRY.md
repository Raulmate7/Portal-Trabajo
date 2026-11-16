# Matriz de Fuentes de Empleo y Cumplimiento Sui Generis (`LEG-026`)

> Normativa: Directiva 96/9/CE (Derecho *sui generis* de bases de datos), Art. 133 LPI (RDL 1/1996) y Directiva (UE) 2019/790 (TDM).

## Principios de Cumplimiento Aplicados
1. **Metadatos factuales mínimos**: Ningún scraper almacena descripciones íntegras (`allow_full_description = False`), limitando los extractos a un máximo de `240`–`280` caracteres.
2. **Atribución y enlace profundo**: Toda oferta agregada enlaza a su `url_source` original con `rel="nofollow noopener noreferrer"`.
3. **Respeto técnico TDM (`backend/logic/tdm.py`)**: Comprobación *fail-closed* de `robots.txt` y cabeceras `TDM-Reservation: 1`.
4. **Retirada ágil (*Notice-and-Takedown*)**: Canal directo documentado en `/aviso-legal` (Art. 16 LSSI-CE y Art. 16 DSA).

| Clave | Fuente | Base / Política | Extracto Máx. |
|---|---|---|---|
| `remotive` | Remotive Public API | API pública con atribución | 280 chars |
| `remoteok` | RemoteOK JSON Feed | Feed público con atribución | 280 chars |
| `himalayas` | Himalayas Remote Jobs API | API pública con atribución + TDM | 280 chars |
| `workingnomads` | Working Nomads Public API | API pública con atribución | 280 chars |
| `wwr` | We Work Remotely RSS | RSS público con atribución | 280 chars |
| `pythonorg` | Python.org Jobs RSS | RSS comunitario abierto | 280 chars |
| `jobfluent` | JobFluent | Metadatos factuales con atribución | 280 chars |
| `tecnoempleo` | Tecnoempleo | Metadatos factuales con atribución | 240 chars |
| `infoempleo` | Infoempleo | Metadatos factuales con atribución | 240 chars |
