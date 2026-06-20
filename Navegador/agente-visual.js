import { chromium } from 'playwright';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Inicializamos el cliente oficial de Gemini usando Vertex AI o la clave de API como fallback
let ai;
const useVertex = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith("AQ.");

if (useVertex) {
    console.log('ℹ️ Usando Vertex AI (Service Account) para el análisis de Gemini...');
    // Eliminamos el API key del env para forzar la autenticación de Vertex
    delete process.env.GEMINI_API_KEY;
    ai = new GoogleGenAI({ 
        vertexai: true,
        project: 'proyectoadsof', 
        location: 'us-central1' 
    });
} else {
    console.log('ℹ️ Usando Gemini Developer API (API Key) para el análisis...');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Usamos gemini-2.5-flash ya que está disponible y tiene cuota activa
const MODEL_NAME = 'gemini-2.5-flash';

async function runVisualQA() {
    let browser;
    let page;
    let isCDP = true;

    try {
        console.log('🔌 Conectando al navegador Chrome activo en el puerto 9222...');
        browser = await chromium.connectOverCDP('http://localhost:9222');
        const defaultContext = browser.contexts()[0];
        page = defaultContext.pages()[0];
        console.log(`✅ Conectado exitosamente via CDP. Auditando la página actual: ${page.url()}`);
    } catch (error) {
        console.log('⚠️ No se pudo conectar a Chrome en el puerto 9222.');
        console.log('🚀 Lanzando una nueva instancia local y autónoma de Chromium (Headless)...');
        isCDP = false;
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        page = await context.newPage();
        
        // Navegamos al Portal de Empleo
        const targetUrl = 'http://localhost:3000';
        console.log(`🔗 Navegando a: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'networkidle' });
    }

    const currentUrl = page.url();

    const auditData = {
        consoleErrors: [],
        networkErrors: []
    };

    // 1. Escuchar errores del lado del cliente
    page.on('pageerror', error => {
        auditData.consoleErrors.push(`Excepción JS: ${error.message}`);
        console.log(`[ALERTA CAZADA] Excepción JS: ${error.message}`);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            auditData.consoleErrors.push(`Error consola: ${msg.text()}`);
            console.log(`[ALERTA CAZADA] Error de consola: ${msg.text()}`);
        }
    });

    // 2. Escuchar fallos de red
    page.on('response', response => {
        if (!response.ok() && response.status() >= 400) {
            auditData.networkErrors.push(`Fallo ${response.status()} al llamar a: ${response.url()}`);
            console.log(`[ALERTA CAZADA] Red: Fallo ${response.status()} en ${response.url()}`);
        }
    });

    // 3. Fase de "Toqueteo": Buscar y clicar elementos en tu pantalla
    console.log('🤖 Iniciando interacción autónoma. Simulando clics...');
    
    // Extraemos botones, enlaces y campos de formulario
    const interactables = await page.$$('button, a, input[type="submit"], input[type="button"]');
    const maxClicks = Math.min(interactables.length, 10);
    console.log(`Interactuando con hasta ${maxClicks} elementos interactivos...`);
    
    for (let i = 0; i < maxClicks; i++) {
        try {
            const isVisible = await interactables[i].isVisible();
            if (isVisible) {
                // Hacemos scroll hacia el elemento y hacemos clic
                await interactables[i].scrollIntoViewIfNeeded();
                await interactables[i].click({ timeout: 2000, noWaitAfter: true });
                
                // Pausa visual para dar tiempo al DOM y para que puedas observar qué hace
                await page.waitForTimeout(1000); 
            }
        } catch (e) {
            // Ignoramos elementos que no se pueden clicar en este momento y seguimos
        }
    }

    // 4. Captura del estado final
    console.log('📸 Tomando captura del estado de la interfaz...');
    const screenshotBuffer = await page.screenshot({ fullPage: true });

    // Nos desconectamos o cerramos el navegador
    if (isCDP) {
        await browser.close();
    } else {
        await browser.close();
    }

    // 5. Análisis del reporte con Gemini
    console.log(`🧠 Procesando datos con Gemini (${MODEL_NAME})...`);
    
    const prompt = `
    Eres un auditor de QA Senior. He utilizado un agente para interactuar con mi aplicación web en vivo.
    
    Aquí están los registros interceptados:
    - Errores de Consola: ${auditData.consoleErrors.length > 0 ? auditData.consoleErrors.join(' | ') : 'Ninguno detectado'}
    - Errores de Red: ${auditData.networkErrors.length > 0 ? auditData.networkErrors.join(' | ') : 'Ninguno detectado'}
    
    Adjunto una captura de pantalla del estado de la interfaz tras la interacción.
    
    Por favor, analiza la imagen y los logs, y proporciona:
    1. La causa probable de cualquier error técnico capturado.
    2. Fallos visuales evidentes (UI rota, textos solapados, problemas de diseño).
    3. Pasos exactos recomendados para solucionarlo en el código fuente.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                prompt,
                {
                    inlineData: {
                        data: screenshotBuffer.toString("base64"),
                        mimeType: "image/png"
                    }
                }
            ]
        });
        
        console.log('\n================ REPORTE DE GEMINI ================');
        console.log(response.text);
        console.log('===================================================\n');
        
    } catch (error) {
        console.error('Error al contactar con la API de Gemini:', error);
    }
}

runVisualQA();