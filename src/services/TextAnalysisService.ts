import natural from 'natural';
import compromise from 'compromise';
import Sentiment from 'sentiment';

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
      classification: 'positive' | 'negative' | 'neutral';
      positive: string[];
      negative: string[];
    };
    readability: {
      fleschKincaidGrade: number;
      fleschReadingEase: number;
      difficulty: 'very easy' | 'easy' | 'fairly easy' | 'standard' | 'fairly difficult' | 'difficult' | 'very difficult';
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

export class TextAnalysisService {
  private sentiment = new Sentiment();

  async analyzeText(text: string): Promise<TextAnalysisResult> {
    const startTime = Date.now();

    try {
      // Análises básicas
      const basic = this.getBasicAnalysis(text);
      
      // Análises linguísticas
      const linguistic = await this.getLinguisticAnalysis(text);
      
      // Análises avançadas
      const advanced = this.getAdvancedAnalysis(text);

      const processingTime = Date.now() - startTime;

      return {
        basic,
        linguistic,
        advanced,
        metadata: {
          processingTime,
          analyzedAt: new Date().toISOString(),
        }
      } as any;

    } catch (error) {
      console.error('Erro na análise de texto:', error);
      throw new Error('Falha ao analisar o texto');
    }
  }

  private getBasicAnalysis(text: string) {
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      characterCount,
      characterCountNoSpaces,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? Math.round((words.length / sentences.length) * 100) / 100 : 0,
      averageCharactersPerWord: words.length > 0 ? Math.round((characterCountNoSpaces / words.length) * 100) / 100 : 0,
    };
  }

  private async getLinguisticAnalysis(text: string) {
    // Análise de sentimento
    const sentimentResult = this.sentiment.analyze(text);
    const sentimentClassification = this.classifySentiment(sentimentResult.comparative);

    // Análise de legibilidade
    const readability = this.calculateReadability(text);

    // Extração de palavras-chave
    const keywords = this.extractKeywords(text);

    // Extração de entidades nomeadas
    const entities = this.extractEntities(text);

    return {
      sentiment: {
        score: sentimentResult.score,
        comparative: Math.round(sentimentResult.comparative * 1000) / 1000,
        classification: sentimentClassification,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative,
      },
      readability,
      keywords,
      entities,
    };
  }

  private getAdvancedAnalysis(text: string) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = [...new Set(words)];
    const wordFrequency = this.getWordFrequency(words);

    return {
      languageDetection: this.detectLanguage(text),
      textComplexity: this.calculateTextComplexity(text),
      uniqueWords: uniqueWords.length,
      lexicalDiversity: words.length > 0 ? Math.round((uniqueWords.length / words.length) * 10000) / 10000 : 0,
      mostFrequentWords: wordFrequency.slice(0, 10),
    };
  }

  private classifySentiment(comparative: number): 'positive' | 'negative' | 'neutral' {
    if (comparative > 0.1) return 'positive';
    if (comparative < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateReadability(text: string) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

    const avgSentenceLength = words.length / sentences.length || 0;
    const avgSyllablesPerWord = syllables / words.length || 0;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

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
    
    if (word.endsWith('e')) syllableCount--;
    if (syllableCount === 0) syllableCount = 1;
    
    return syllableCount;
  }

  private classifyReadingDifficulty(score: number) {
    if (score >= 90) return 'very easy';
    if (score >= 80) return 'easy';
    if (score >= 70) return 'fairly easy';
    if (score >= 60) return 'standard';
    if (score >= 50) return 'fairly difficult';
    if (score >= 30) return 'difficult';
    return 'very difficult';
  }

  private extractKeywords(text: string): string[] {
    const doc = compromise(text);
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');
    
    const keywords = [...nouns, ...adjectives]
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase())
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 15);

    return keywords;
  }

  private extractEntities(text: string) {
    const doc = compromise(text);
    
    return {
      people: doc.people().out('array').slice(0, 10),
      places: doc.places().out('array').slice(0, 10),
      organizations: doc.organizations().out('array').slice(0, 10),
    };
  }

  private detectLanguage(text: string): string {
    // Implementação simples de detecção de idioma
    const portugueseWords = ['que', 'não', 'uma', 'para', 'com', 'mais', 'como', 'mas', 'foi', 'pelo'];
    const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had'];
    const spanishWords = ['que', 'para', 'con', 'por', 'como', 'pero', 'más', 'una', 'los', 'del'];

    const words = text.toLowerCase().split(/\s+/);
    
    const ptCount = words.filter(word => portugueseWords.includes(word)).length;
    const enCount = words.filter(word => englishWords.includes(word)).length;
    const esCount = words.filter(word => spanishWords.includes(word)).length;

    if (ptCount > enCount && ptCount > esCount) return 'pt';
    if (enCount > esCount) return 'en';
    if (esCount > 0) return 'es';
    
    return 'unknown';
  }

  private calculateTextComplexity(text: string): number {
    const words = text.match(/\b\w+\b/g) || [];
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;
    const longWords = words.filter(word => word.length > 6).length;
    const longWordRatio = longWords / words.length || 0;
    
    // Complexidade baseada no tamanho médio das palavras e proporção de palavras longas
    return Math.round((avgWordLength * 0.5 + longWordRatio * 10) * 100) / 100;
  }

  private getWordFrequency(words: string[]): Array<{ word: string; count: number }> {
    const frequency: { [key: string]: number } = {};
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'o', 'a', 'e', 'é', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'que', 'se', 'na', 'por', 'mais', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'numa', 'pelos', 'pelas', 'esse', 'eles', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'pelas', 'essas', 'esses', 'pelas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo']);

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }
}
