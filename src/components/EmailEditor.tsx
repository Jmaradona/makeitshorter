import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Send, Sparkles, AlertTriangle } from 'lucide-react';
import ToneSelector from './ToneSelector';
import ResizableOutput from './ResizableOutput';
import UsageBanner from './UsageBanner';
import PaymentModal from './PaymentModal';
import LoginRequiredModal from './LoginRequiredModal';
import { enhanceEmail } from '../services/aiService';
import { countWords, cleanAIResponse, extractEmailParts } from '../utils/textUtils';
import { useUserStore } from '../store/userStore';
import { checkUsage } from '../services/usageService';
import AnimatedPlaceholder from './AnimatedPlaceholder';
import SubscriptionBanner from './SubscriptionBanner';

interface Persona {
  style: string;
  formality: string;
  traits: string[];
  context: string;
}

interface EmailEditorProps {
  persona: Persona;
  assistantId?: string;
}

const MAX_INPUT_WORDS = 2000;

// Length adjustments as percentages of original
const LENGTH_ADJUSTMENTS = {
  concise: 0.75, // 75% of original (changed from 0.5 to 0.75)
  balanced: 1.0, // 100% of original - MUST be exact match
  detailed: 1.5  // 150% of original
};

// Minimum word counts to ensure reasonable output
const MIN_WORD_COUNTS = {
  concise: 25,
  balanced: 50, // Minimum for balanced to allow meaningful content
  detailed: 150
};

export default function EmailEditor({ persona, assistantId }: EmailEditorProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputSubject, setOutputSubject] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLength, setSelectedLength] = useState('balanced');
  const [selectedInputType, setSelectedInputType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [targetWordCount, setTargetWordCount] = useState<number | null>(null);
  const [actualWordCount, setActualWordCount] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const { isOfflineMode, user, remainingMessages, setRemainingMessages } = useUserStore();
  
  const [hasShownOutput, setHasShownOutput] = useState(false);
  const [triggerInitialAnimation, setTriggerInitialAnimation] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  // New state for modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastRequestRef = useRef<{
    timestamp: number;
    wordCount: number;
  } | null>(null);

  useEffect(() => {
    setShowPlaceholder(!inputText);
  }, [inputText, isInputFocused]);

  // Fetch initial usage data
  useEffect(() => {
    const fetchUsage = async () => {
      const usageData = await checkUsage(user?.id);
      setRemainingMessages(usageData.remainingMessages);
    };
    
    fetchUsage();
  }, [user, setRemainingMessages]);

  // Calculate target word count based on input text and selected length
  const calculateTargetWords = (text: string, lengthType: string): number => {
    // Extract just the body content if it's an email for more accurate counting
    let contentToCount = text;
    if (selectedInputType === 'email') {
      const { body } = extractEmailParts(text);
      if (body) contentToCount = body;
    }
    
    const currentWords = countWords(contentToCount);
    console.log('Current input word count:', currentWords);
    
    // Special handling for balanced mode (same length)
    if (lengthType === 'balanced') {
      // For balanced mode, use the exact word count without rounding
      return currentWords;
    }
    
    // For other modes, use the adjustment factor
    const adjustmentFactor = LENGTH_ADJUSTMENTS[lengthType as keyof typeof LENGTH_ADJUSTMENTS] || 1.0;
    
    // Calculate target based on percentage of current words
    let targetWords = Math.round(currentWords * adjustmentFactor);
    
    // Ensure minimum word count based on length type
    const minWords = MIN_WORD_COUNTS[lengthType as keyof typeof MIN_WORD_COUNTS] || MIN_WORD_COUNTS.balanced;
    
    // Only apply minimum word count if the input is above a certain threshold
    // This prevents small inputs from being expanded too much
    if (currentWords > 20) {
      targetWords = Math.max(targetWords, minWords);
    } else {
      // For very small inputs, adjust proportionally
      const smallInputMinimum = Math.max(10, Math.round(currentWords * adjustmentFactor));
      targetWords = Math.max(targetWords, smallInputMinimum);
    }
    
    // Round to nearest 5 for cleaner targets (only for non-balanced modes)
    targetWords = Math.round(targetWords / 5) * 5;
    
    console.log(`Target word count: ${targetWords} (${adjustmentFactor * 100}% of ${currentWords})`);
    return targetWords;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const wordCount = countWords(text);
    
    if (wordCount > MAX_INPUT_WORDS) {
      setError(`Text exceeds ${MAX_INPUT_WORDS} words limit. Please shorten your input.`);
    } else {
      setError('');
    }
    
    setInputText(text);
  };

  const handleEnhance = async (customWordCount?: number) => {
    if (!inputText.trim() || isLoading) return;

    const wordCount = countWords(inputText);
    if (wordCount > MAX_INPUT_WORDS) {
      setError(`Text exceeds ${MAX_INPUT_WORDS} words limit. Please shorten your input.`);
      return;
    }

    setIsLoading(true);
    setError('');
    setWarning('');
    setProcessingStatus('');

    try {
      // Use custom word count if provided (from resizing), otherwise calculate based on length setting
      const targetWords = customWordCount ?? calculateTargetWords(inputText, selectedLength);
      setTargetWordCount(targetWords);
      
      lastRequestRef.current = {
        timestamp: Date.now(),
        wordCount: targetWords
      };
      
      const isExactWordCountRequired = selectedLength === 'balanced' && !customWordCount;
      console.log(`Enhancing text to ${targetWords} words (Mode: ${isOfflineMode ? 'Test' : 'Online'}, Exact match: ${isExactWordCountRequired})`);
      setProcessingStatus(`Processing in ${isOfflineMode ? 'Test' : 'Online'} mode...`);

      const response = await enhanceEmail({
        content: inputText,
        tone: `${selectedTone} with ${persona.style} style, ${persona.formality} formality, in a ${persona.context} context, emphasizing ${persona.traits.join(', ')}`,
        targetWords,
        inputType: selectedInputType,
        enforceExactWordCount: isExactWordCountRequired
      });

      if (response.error) {
        if (response.error === 'login_required') {
          setIsLoginModalOpen(true);
          return;
        } else if (response.error === 'payment_required') {
          setIsPaymentModalOpen(true);
          return;
        } else {
          setError(response.error);
          return;
        }
      }
      
      if (response.warning) {
        setWarning(response.warning);
      }

      const content = cleanAIResponse(response.enhancedContent);
      
      // Parse the email using the improved extraction function
      const { subject, body, greeting, signature } = extractEmailParts(content);
      
      if (subject) {
        setOutputSubject(subject);
      } else if (selectedInputType === 'email') {
        // Generate a basic subject if none was provided
        const firstLine = content.split('\n', 1)[0].trim();
        setOutputSubject(firstLine.length > 5 && firstLine.length < 60 ? 
          `Re: ${firstLine}` : 'Re: Your Message');
      }
      
      // Set the body text for display
      if (selectedInputType === 'email') {
        // Reconstruct the body with greeting and signature for display
        let fullBody = '';
        if (greeting) fullBody += greeting + '\n\n';
        fullBody += body;
        if (signature) fullBody += '\n\n' + signature;
        setOutputText(fullBody.trim());
      } else {
        setOutputText(body.trim());
      }
      
      // Calculate and set the actual body word count (excluding greeting/signature)
      const bodyWordCount = countWords(body);
      setActualWordCount(bodyWordCount);
      console.log(`Generated body with ${bodyWordCount} words (target: ${targetWords})`);
      
      // For balanced mode, warn if the word count is off by more than 1 word
      // For other modes, only warn if off by more than 5% or 10 words
      const tolerance = isExactWordCountRequired ? 0 : Math.max(10, Math.round(targetWords * 0.05));
      if (Math.abs(bodyWordCount - targetWords) > tolerance) {
        console.warn(`Word count mismatch: expected ${targetWords}, got ${bodyWordCount}`);
        if (!warning) {
          setWarning(
            isExactWordCountRequired
              ? `The AI generated ${bodyWordCount} words instead of maintaining the original ${targetWords} words.`
              : `The AI generated ${bodyWordCount} words instead of the requested ${targetWords} words.`
          );
        }
      }
      
      if (!hasShownOutput) {
        setHasShownOutput(true);
        setTimeout(() => {
          setTriggerInitialAnimation(true);
        }, 100);
      }
    } catch (err) {
      setError('Failed to enhance content. Please try again.');
      console.error('Error enhancing content:', err);
    } finally {
      setIsLoading(false);
      setProcessingStatus('');
    }
  };

  const handleRegenerateBody = () => {
    // Reuse the existing enhance function with the current target word count
    if (targetWordCount) {
      handleEnhance(targetWordCount);
    } else {
      handleEnhance();
    }
  };

  const handleRegenerateSubject = async () => {
    if (!outputText || isLoading) return;

    setIsLoading(true);
    try {
      // Use a similar request but specifically for regenerating the subject
      const response = await enhanceEmail({
        content: outputText,
        tone: `${selectedTone} with ${persona.style} style, ${persona.formality} formality, in a ${persona.context} context, emphasizing ${persona.traits.join(', ')}`,
        targetWords: 5, // Short word count for subject
        inputType: 'subject',
        enforceExactWordCount: false
      });

      if (response.error) {
        if (response.error === 'login_required') {
          setIsLoginModalOpen(true);
          return;
        } else if (response.error === 'payment_required') {
          setIsPaymentModalOpen(true);
          return;
        } else {
          setError(response.error);
          return;
        }
      }

      // Extract just the subject from the response
      const content = cleanAIResponse(response.enhancedContent);
      let newSubject = content;
      
      // Remove any "Subject:" prefix if present
      if (newSubject.toLowerCase().startsWith('subject:')) {
        newSubject = newSubject.substring(8).trim();
      }
      
      // Limit subject length if too long
      if (newSubject.length > 120) {
        newSubject = newSubject.substring(0, 120) + '...';
      }
      
      setOutputSubject(newSubject);
    } catch (err) {
      console.error('Error regenerating subject:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentWordCount = countWords(inputText);
  const isOverLimit = currentWordCount > MAX_INPUT_WORDS;

  const placeholderTexts = [
    `Paste or write your ${selectedInputType} content here...`,
    `Share your ${selectedInputType} draft and we'll make it better...`,
    `Type your ${selectedInputType} here and see it transform...`,
    `Need help with your ${selectedInputType}? Start typing...`
  ];

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4 pb-16 lg:p-8 lg:pb-20 overflow-y-auto lg:overflow-auto bg-white dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full flex flex-col gap-4 md:gap-6 pt-4 lg:pt-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Input</h2>
          </div>
          {isOfflineMode && (
            <span className="text-amber-600 dark:text-amber-400 text-xs md:text-sm font-medium px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              Test Mode
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col space-y-4 md:space-y-6 overflow-hidden">
          <UsageBanner 
            remainingMessages={remainingMessages} 
            showUpgradeButton={user !== null && remainingMessages <= 0}
            onUpgradeClick={() => setIsPaymentModalOpen(true)} 
          />
          
          <SubscriptionBanner />
          
          <div className="flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Content
              </label>
              <span className={`text-xs md:text-sm ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {currentWordCount} / {MAX_INPUT_WORDS} words
              </span>
            </div>
            <div className="input-area flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleTextChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className={`h-full w-full p-3 md:p-4 border ${
                  isOverLimit 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-200 focus:border-red-400' 
                    : 'border-gray-200 dark:border-gray-800 focus:ring-gray-400/20 focus:border-gray-400'
                } rounded-lg focus:ring-2 dark:focus:border-gray-700 transition-all resize-none text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 scrollbar-thin relative z-10`}
              />
              
              <AnimatedPlaceholder 
                texts={placeholderTexts}
                isVisible={showPlaceholder}
              />
            </div>
            {isOverLimit && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-red-500 text-xs md:text-sm"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Text exceeds {MAX_INPUT_WORDS} words limit</span>
              </motion.div>
            )}
          </div>

          <ToneSelector
            selectedTone={selectedTone}
            onToneSelect={setSelectedTone}
            selectedLength={selectedLength}
            onLengthSelect={setSelectedLength}
            selectedInputType={selectedInputType}
            onInputTypeSelect={setSelectedInputType}
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleEnhance()}
            data-tutorial="enhance"
            disabled={isLoading || !inputText.trim() || isOverLimit}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-gray-100 shadow-sm"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            <span className="text-sm font-medium">
              {isLoading ? processingStatus || 'Processing...' : 'Enhance Text'}
            </span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full flex flex-col gap-4 md:gap-6 pt-4 lg:pt-0 lg:pl-6 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <Send className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Enhanced Version {actualWordCount ? <span className="text-sm font-normal">({actualWordCount} words)</span> : ''}
            </h2>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-[200px] overflow-hidden">
          {error ? (
            <div className="flex-1 p-3 md:p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-900/10">
              <p className="text-red-600 dark:text-red-400 text-sm md:text-base">{error}</p>
            </div>
          ) : outputText ? (
            <>
              {warning && (
                <div className="mb-3 md:mb-4 p-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                  <p className="text-amber-600 dark:text-amber-400 text-xs md:text-sm">{warning}</p>
                </div>
              )}
              <ResizableOutput
                text={outputText}
                subject={outputSubject}
                onResize={handleEnhance}
                onRegenerateBody={handleRegenerateBody}
                onRegenerateSubject={handleRegenerateSubject}
                isLoading={isLoading}
                targetWordCount={targetWordCount}
                actualWordCount={actualWordCount}
                inputType={selectedInputType}
                shouldPlayAnimation={triggerInitialAnimation}
                onAnimationComplete={() => setTriggerInitialAnimation(false)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-400 dark:text-gray-500 text-sm md:text-base px-4 text-center">Enhanced version will appear here</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />

      {/* Login Required Modal */}
      <LoginRequiredModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}