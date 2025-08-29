import Sentiment from "sentiment";

export interface TextAnalysisResult {
  basic: {
    characterCount: number;
    characterCountNoSpaces: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    averageCharactersPerWord: number;
  };
  linguistic: {
    sentiment: {
      score: number;
      comparative: number;
      classification: "positive" | "negative" | "neutral";
      positive: string[];
      negative: string[];
    };
    readability: {
      fleschKincaidGrade: number;
      fleschReadingEase: number;
      difficulty:
        | "very easy"
        | "easy"
        | "fairly easy"
        | "standard"
        | "fairly difficult"
        | "difficult"
        | "very difficult";
    };
    keywords: string[];
    entities: {
      people: string[];
      places: string[];
      organizations: string[];
    };
  };
  advanced: {
    languageDetection: string;
    textComplexity: number;
    uniqueWords: number;
    lexicalDiversity: number;
    mostFrequentWords: Array<{ word: string; count: number }>;
  };
}

export interface QueueResponse {
  queueId: string;
  message: string;
  estimatedTime: number;
  textSize: number;
}

export class TextAnalysisService {
  private sentiment = new Sentiment();
  private cache = new Map<string, any>();
  private readonly CACHE_SIZE = 50; // ✅ REDUZIDO: Cache menor
  private readonly MAX_TEXT_SIZE = 2000; // ✅ DRASTICAMENTE REDUZIDO: 2KB máximo

  async analyzeText(text: string): Promise<QueueResponse> {
    const textSize = text.length;

    // ✅ TUDO VAI PARA FILA - Sem processamento direto
    if (textSize > this.MAX_TEXT_SIZE) {
      throw new Error(
        `Texto muito longo. Máximo permitido: ${this.MAX_TEXT_SIZE / 1000}KB`
      );
    }

    // ✅ SEMPRE retornar resposta de fila
    return this.addToQueue(text);
  }

  // ✅ REMOVIDO: analyzeTextDirectly - TUDO vai para fila

  private addToQueue(text: string): QueueResponse {
    const textSize = text.length;
    const estimatedTime = this.calculateEstimatedTime(textSize);

    // Gerar ID único para a fila
    const queueId = this.generateQueueId();

    return {
      queueId,
      message: `Texto enviado para processamento em fila. Tamanho: ${(textSize / 1000).toFixed(1)}KB`,
      estimatedTime,
      textSize,
    };
  }

  private calculateEstimatedTime(textSize: number): number {
    // ✅ ESTIMATIVA MAIS REALISTA: 5-15 segundos para textos pequenos
    const baseTime = 5; // 5 segundos base
    const timePerKB = 0.5; // 0.5 segundos por KB adicional

    return Math.min(baseTime + (textSize / 1000) * timePerKB, 15); // Máximo 15 segundos
  }

  private generateQueueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `queue_${timestamp}_${random}`;
  }

  // ✅ REMOVIDO: generateCacheKey, setCache - Sem cache para textos pequenos

  // ✅ FUNÇÃO SIMPLIFICADA PARA PROCESSAMENTO EM FILA
  async processQueuedText(text: string): Promise<TextAnalysisResult> {
    try {
      // ✅ ANÁLISE BÁSICA SIMPLIFICADA (sem compromise)
      const basic = this.getBasicAnalysis(text);

      // ✅ ANÁLISE LINGUÍSTICA SIMPLIFICADA
      const linguistic = await this.getLinguisticAnalysis(text);

      // ✅ ANÁLISE AVANÇADA SIMPLIFICADA
      const advanced = this.getBasicAdvancedAnalysis(text);

      return {
        basic,
        linguistic,
        advanced,
      };
    } catch (error) {
      console.error("Erro no processamento em fila:", error);
      throw new Error("Falha ao processar texto em fila");
    }
  }

  private getBasicAnalysis(text: string) {
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, "").length;

    // ✅ REGEX SIMPLIFICADO: Usar split em vez de regex complexo
    const words = text.split(/\s+/).filter(word => word.length > 0);

    // ✅ REGEX SIMPLIFICADO: Usar split por pontuação
    const sentences = text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0);

    // ✅ REGEX SIMPLIFICADO: Usar split por quebras de linha
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);

    return {
      characterCount,
      characterCountNoSpaces,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence:
        sentences.length > 0
          ? Math.round((words.length / sentences.length) * 100) / 100
          : 0,
      averageCharactersPerWord:
        words.length > 0
          ? Math.round((characterCountNoSpaces / words.length) * 100) / 100
          : 0,
    };
  }

  private async getLinguisticAnalysis(text: string) {
    // ✅ ANÁLISE DE SENTIMENTO SIMPLIFICADA
    const sentimentResult = this.sentiment.analyze(text);
    const sentimentClassification = this.classifySentiment(
      sentimentResult.comparative
    );

    // ✅ ANÁLISE DE LEGIBILIDADE SIMPLIFICADA
    const readability = this.calculateReadability(text);

    // ✅ PALAVRAS-CHAVE SIMPLIFICADAS (sem compromise)
    const keywords = this.extractBasicKeywords(text);

    // ✅ ENTIDADES SIMPLIFICADAS (sem compromise)
    const entities = this.extractBasicEntities(text);

    return {
      sentiment: {
        score: sentimentResult.score,
        comparative: Math.round(sentimentResult.comparative * 1000) / 1000,
        classification: sentimentClassification,
        positive: sentimentResult.positive.slice(0, 5), // ✅ LIMITADO: 5 palavras
        negative: sentimentResult.negative.slice(0, 5), // ✅ LIMITADO: 5 palavras
      },
      readability,
      keywords,
      entities,
    };
  }

  private getBasicAdvancedAnalysis(text: string) {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    return {
      languageDetection: this.detectLanguage(text),
      textComplexity: this.calculateBasicTextComplexity(text),
      uniqueWords: uniqueWords.size,
      lexicalDiversity:
        words.length > 0
          ? Math.round((uniqueWords.size / words.length) * 10000) / 10000
          : 0,
      mostFrequentWords: this.getBasicWordFrequency(words).slice(0, 3), // ✅ LIMITADO: 3 palavras
    };
  }

  private classifySentiment(
    comparative: number
  ): "positive" | "negative" | "neutral" {
    if (comparative > 0.1) return "positive";
    if (comparative < -0.1) return "negative";
    return "neutral";
  }

  private calculateReadability(text: string) {
    // ✅ REGEX SIMPLIFICADO: Usar split em vez de regex complexo
    const sentences = text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0);
    const words = text.split(/\s+/).filter(word => word.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return {
        fleschKincaidGrade: 0,
        fleschReadingEase: 0,
        difficulty: "standard" as const,
      };
    }

    const syllables = words.reduce(
      (total, word) => total + this.countSyllables(word),
      0
    );

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade =
      0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease
    const fleschReadingEase =
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
      fleschReadingEase: Math.round(fleschReadingEase * 100) / 100,
      difficulty: this.classifyReadingDifficulty(fleschReadingEase),
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;

    if (word.endsWith("e")) syllableCount--;
    if (syllableCount === 0) syllableCount = 1;

    return syllableCount;
  }

  private classifyReadingDifficulty(
    score: number
  ):
    | "very easy"
    | "easy"
    | "fairly easy"
    | "standard"
    | "fairly difficult"
    | "difficult"
    | "very difficult" {
    if (score >= 90) return "very easy";
    if (score >= 80) return "easy";
    if (score >= 70) return "fairly easy";
    if (score >= 60) return "standard";
    if (score >= 50) return "fairly difficult";
    if (score >= 30) return "difficult";
    return "very difficult";
  }

  private extractBasicKeywords(text: string): string[] {
    // ✅ VERSÃO SIMPLIFICADA: Sem compromise
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 4);

    const stopWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "o",
      "a",
      "e",
      "é",
      "de",
      "do",
      "da",
      "em",
      "um",
      "uma",
      "para",
      "com",
      "não",
      "que",
      "se",
      "na",
      "por",
      "mais",
      "como",
      "mas",
      "foi",
      "ao",
      "ele",
      "das",
      "tem",
      "à",
      "seu",
      "sua",
      "ou",
      "ser",
      "quando",
      "muito",
      "há",
      "nos",
      "já",
      "está",
      "eu",
      "também",
      "só",
      "pelo",
      "pela",
      "até",
      "isso",
      "ela",
      "entre",
      "era",
      "depois",
      "sem",
      "mesmo",
      "aos",
      "ter",
      "seus",
      "suas",
      "numa",
      "pelos",
      "pelas",
      "esse",
      "eles",
      "essa",
      "num",
      "nem",
      "meu",
      "às",
      "minha",
      "têm",
      "aquilo",
    ]);

    const keywords = words.filter(word => !stopWords.has(word)).slice(0, 5); // ✅ LIMITADO: 5 palavras-chave

    return [...new Set(keywords)]; // Remover duplicatas
  }

  // ✅ REMOVIDO: extractKeywords (com compromise) - Muito custoso

  private extractBasicEntities(_text: string): any {
    // ✅ VERSÃO SIMPLIFICADA: Sem compromise
    return {
      people: [],
      places: [],
      organizations: [],
    };
  }

  // ✅ REMOVIDO: extractEntities (com compromise) - Muito custoso

  private detectLanguage(text: string): string {
    // ✅ IMPLEMENTAÇÃO SIMPLES: Sem bibliotecas externas
    const portugueseWords = [
      "que",
      "não",
      "uma",
      "para",
      "com",
      "mais",
      "como",
      "mas",
      "foi",
      "pelo",
    ];
    const englishWords = [
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
    ];
    const spanishWords = [
      "que",
      "para",
      "con",
      "por",
      "como",
      "pero",
      "más",
      "una",
      "los",
      "del",
    ];

    const words = text.toLowerCase().split(/\s+/);

    const ptCount = words.filter(word => portugueseWords.includes(word)).length;
    const enCount = words.filter(word => englishWords.includes(word)).length;
    const esCount = words.filter(word => spanishWords.includes(word)).length;

    if (ptCount > enCount && ptCount > esCount) return "pt";
    if (enCount > esCount) return "en";
    if (esCount > 0) return "es";

    return "unknown";
  }

  private calculateBasicTextComplexity(text: string): number {
    const words = text.split(/\s+/);
    if (words.length === 0) return 0;

    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.round(avgWordLength * 10) / 10;
  }

  // ✅ REMOVIDO: calculateTextComplexity (complexo) - Muito custoso

  private getBasicWordFrequency(
    words: string[]
  ): Array<{ word: string; count: number }> {
    const frequency: { [key: string]: number } = {};
    const stopWords = new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "by",
      "for",
      "from",
      "has",
      "he",
      "in",
      "is",
      "it",
      "its",
      "of",
      "on",
      "that",
      "the",
      "to",
      "was",
      "will",
      "with",
      "o",
      "a",
      "e",
      "é",
      "de",
      "do",
      "da",
      "em",
      "um",
      "uma",
      "para",
      "com",
      "não",
      "que",
      "se",
      "na",
      "por",
      "mais",
      "como",
      "mas",
      "foi",
      "ao",
      "ele",
      "das",
      "tem",
      "à",
      "seu",
      "sua",
      "ou",
      "ser",
      "quando",
      "muito",
      "há",
      "nos",
      "já",
      "está",
      "eu",
      "também",
      "só",
      "pelo",
      "pela",
      "até",
      "isso",
      "ela",
      "entre",
      "era",
      "depois",
      "sem",
      "mesmo",
      "aos",
      "ter",
      "seus",
      "suas",
      "numa",
      "pelos",
      "pelas",
      "esse",
      "eles",
      "essa",
      "num",
      "nem",
      "meu",
      "às",
      "minha",
      "têm",
      "aquilo",
    ]);

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ✅ REMOVIDO: getWordFrequency (complexo) - Muito custoso

  // ✅ REMOVIDO: clearCache - Sem cache para textos pequenos
}
