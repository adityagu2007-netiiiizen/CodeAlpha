/**
 * LinguaFlow - Language Translator
 * Uses Google Translate API for proper native script translations
 */

// ===== DOM Elements =====
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const sourceLang = document.getElementById('source-lang');
const targetLang = document.getElementById('target-lang');
const swapBtn = document.getElementById('swap-btn');
const translateBtn = document.getElementById('translate-btn');
const copyBtn = document.getElementById('copy-btn');
const speakInputBtn = document.getElementById('speak-input');
const speakOutputBtn = document.getElementById('speak-output');
const inputCount = document.getElementById('input-count');
const outputCount = document.getElementById('output-count');

// ===== Language Codes for Speech =====
const speechCodes = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-BR',
  'ru': 'ru-RU',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'zh-CN': 'zh-CN',
  'ar': 'ar-SA',
  'hi': 'hi-IN'
};

// ===== Helper Functions =====

function updateInputCount() {
  if (inputCount) {
    inputCount.textContent = inputText.value.length;
  }
}

function updateOutputCount() {
  if (outputCount) {
    outputCount.textContent = outputText.value.length;
  }
}

function setLoading(isLoading) {
  const spinner = translateBtn.querySelector('.spinner');
  const icon = translateBtn.querySelector('.translate-icon');
  const text = translateBtn.querySelector('.btn-text');
  
  if (isLoading) {
    spinner.classList.remove('hidden');
    icon.classList.add('hidden');
    text.textContent = 'Translating...';
    translateBtn.disabled = true;
  } else {
    spinner.classList.add('hidden');
    icon.classList.remove('hidden');
    text.textContent = 'Translate';
    translateBtn.disabled = false;
  }
}

// ===== Translation Function using Google Translate =====

async function translate() {
  const text = inputText.value.trim();
  
  if (!text) {
    outputText.value = '';
    updateOutputCount();
    return;
  }
  
  const source = sourceLang.value;
  const target = targetLang.value;
  
  // Same language check
  if (source === target) {
    outputText.value = text;
    updateOutputCount();
    return;
  }
  
  setLoading(true);
  
  try {
    // Google Translate API (free endpoint) - returns proper native scripts
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Google returns nested array: [[["translated text", "original text", ...]]]
    if (data && data[0]) {
      let translation = '';
      
      // Combine all translated segments
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) {
          translation += data[0][i][0];
        }
      }
      
      outputText.value = translation;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to MyMemory API
    try {
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.responseStatus === 200 && fallbackData.responseData) {
        outputText.value = fallbackData.responseData.translatedText;
      } else {
        outputText.value = 'Translation failed. Please try again.';
      }
    } catch (fallbackError) {
      outputText.value = 'Translation service unavailable. Please check your internet connection.';
    }
  }
  
  setLoading(false);
  updateOutputCount();
}

// ===== Swap Languages =====

function swapLanguages() {
  // Swap select values
  const tempLang = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = tempLang;
  
  // Swap text content
  const tempText = inputText.value;
  inputText.value = outputText.value;
  outputText.value = tempText;
  
  // Update counts
  updateInputCount();
  updateOutputCount();
}

// ===== Text-to-Speech =====

function speak(text, lang) {
  if (!text.trim()) return;
  if (!window.speechSynthesis) {
    alert('Text-to-speech not supported in this browser.');
    return;
  }
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechCodes[lang] || lang;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  
  // Get available voices and try to match
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = (speechCodes[lang] || lang).split('-')[0];
  const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
  
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// ===== Copy to Clipboard =====

async function copyToClipboard() {
  const text = outputText.value.trim();
  
  if (!text) return;
  
  const copyIcon = copyBtn.querySelector('.copy-icon');
  const checkIcon = copyBtn.querySelector('.check-icon');
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Success feedback
    copyIcon.classList.add('hidden');
    checkIcon.classList.remove('hidden');
    copyBtn.classList.add('success');
    
    setTimeout(() => {
      copyIcon.classList.remove('hidden');
      checkIcon.classList.add('hidden');
      copyBtn.classList.remove('success');
    }, 2000);
    
  } catch (err) {
    // Fallback method for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      copyIcon.classList.add('hidden');
      checkIcon.classList.remove('hidden');
      copyBtn.classList.add('success');
      
      setTimeout(() => {
        copyIcon.classList.remove('hidden');
        checkIcon.classList.add('hidden');
        copyBtn.classList.remove('success');
      }, 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
    
    document.body.removeChild(textarea);
  }
}

// ===== Event Listeners =====

// Input character count
inputText.addEventListener('input', updateInputCount);

// Swap button
swapBtn.addEventListener('click', swapLanguages);

// Translate button
translateBtn.addEventListener('click', translate);

// Keyboard shortcut: Ctrl/Cmd + Enter to translate
inputText.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    translate();
  }
});

// Speak input
speakInputBtn.addEventListener('click', function() {
  this.classList.add('speaking');
  speak(inputText.value, sourceLang.value);
  
  setTimeout(() => {
    this.classList.remove('speaking');
  }, 1000);
});

// Speak output
speakOutputBtn.addEventListener('click', function() {
  this.classList.add('speaking');
  speak(outputText.value, targetLang.value);
  
  setTimeout(() => {
    this.classList.remove('speaking');
  }, 1000);
});

// Copy button
copyBtn.addEventListener('click', copyToClipboard);

// ===== Initialize =====

document.addEventListener('DOMContentLoaded', function() {
  // Set initial counts
  updateInputCount();
  updateOutputCount();
  
  // Preload speech voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function() {
      window.speechSynthesis.getVoices();
    };
  }
});