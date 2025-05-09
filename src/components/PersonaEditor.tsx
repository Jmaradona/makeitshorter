import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User2, X, Save, Briefcase, Coffee, Zap, User, Building, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { updateUserProfile } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const styles = [
  { id: 'gen-z', label: 'Gen Z', icon: Zap },
  { id: 'millennial', label: 'Millennial', icon: Coffee },
  { id: 'professional', label: 'Professional', icon: Briefcase },
];

const formalities = [
  { id: 'casual', label: 'Casual' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'formal', label: 'Formal' },
];

const closings = [
  { id: 'best', label: 'Best regards' },
  { id: 'sincerely', label: 'Sincerely' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'cheers', label: 'Cheers' },
  { id: 'regards', label: 'Regards' },
  { id: 'ai', label: 'AI decide' },
];

const traits = [
  'Emoji-friendly 😊',
  'Tech-savvy',
  'Concise',
  'Engaging',
  'Data-driven',
  'Collaborative',
  'Innovative',
  'Results-oriented',
  'Authentic',
];

const contexts = [
  'Startup',
  'Corporate',
  'Creative Agency',
  'Tech Company',
  'Remote-first',
];

interface PersonaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: any) => void;
}

export default function PersonaEditor({ isOpen, onClose, onSave }: PersonaEditorProps) {
  const { user, preferences } = useUserStore();
  const [localPreferences, setLocalPreferences] = React.useState(preferences);
  const [activeTab, setActiveTab] = useState<'style' | 'signature'>('style');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    if (!localPreferences) {
      console.error("Local preferences is undefined or null");
      return;
    }
    
    console.log("Saving preferences:", JSON.stringify(localPreferences, null, 2));
    setIsSaving(true);
    
    // Make a copy to avoid reference issues
    const preferencesToSave = JSON.parse(JSON.stringify(localPreferences));
    
    // Ensure traits is an array
    if (!Array.isArray(preferencesToSave.traits)) {
      console.warn("Fixing traits array before saving");
      preferencesToSave.traits = Array.isArray(preferencesToSave.traits) 
        ? preferencesToSave.traits 
        : [preferencesToSave.traits?.toString() || "Tech-savvy"];
    }
    
    // Update local store first
    onSave(preferencesToSave);
    
    // Then update database if user is logged in
    if (user) {
      try {
        console.log(`Saving preferences to Supabase for user ${user.id}`);
        const success = await updateUserProfile({
          id: user.id,
          email: user.email || '',
          preferences: preferencesToSave
        });
        
        if (success) {
          toast.success('Preferences saved successfully');
          console.log("Preferences saved to database successfully");
        } else {
          toast.error('Failed to save preferences to database');
          console.error("Failed to save preferences to database");
        }
      } catch (error) {
        console.error('Error saving preferences:', error);
        toast.error('Error saving preferences');
      }
    } else {
      console.log("No user logged in, preferences saved to local storage only");
      toast.success('Preferences saved locally');
    }
    
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8"
          >
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2 rounded-lg">
                    <User2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Persona</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'style'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('style')}
                >
                  Communication Style
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'signature'
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('signature')}
                >
                  Signature & Closing
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === 'style' ? (
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {styles.map(({ id, label, icon: Icon }) => (
                          <motion.button
                            key={id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalPreferences({ ...localPreferences, style: id })}
                            className={`p-2 md:p-3 rounded-lg border-2 transition-all ${
                              localPreferences.style === id
                                ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1 md:gap-2">
                              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${localPreferences.style === id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`} />
                              <span className={`text-xs md:text-sm font-medium ${localPreferences.style === id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formality Level</label>
                      <div className="flex flex-wrap gap-2">
                        {formalities.map(({ id, label }) => (
                          <motion.button
                            key={id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalPreferences({ ...localPreferences, formality: id })}
                            className={`flex-1 py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-all text-xs md:text-sm ${
                              localPreferences.formality === id
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication Traits</label>
                      <div className="flex flex-wrap gap-2">
                        {traits.map((trait) => (
                          <motion.button
                            key={trait}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const newTraits = localPreferences.traits.includes(trait)
                                ? localPreferences.traits.filter((t: string) => t !== trait)
                                : [...localPreferences.traits, trait];
                              setLocalPreferences({ ...localPreferences, traits: newTraits });
                            }}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm transition-all ${
                              localPreferences.traits.includes(trait)
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {trait}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Context</label>
                      <div className="flex flex-wrap gap-2">
                        {contexts.map((context) => (
                          <motion.button
                            key={context}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalPreferences({ ...localPreferences, context })}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm transition-all ${
                              localPreferences.context === context
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {context}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Closing</label>
                      <div className="grid grid-cols-3 gap-2">
                        {closings.map(({ id, label }) => (
                          <motion.button
                            key={id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalPreferences({ ...localPreferences, favoriteGoodbye: id })}
                            className={`py-2 px-2 rounded-lg text-xs transition-all ${
                              localPreferences.favoriteGoodbye === id
                                ? id === 'ai' 
                                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg scale-105'
                                  : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                                : id === 'ai'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Signature Information</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Add your information for email signatures
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <input
                            type="text"
                            value={localPreferences.name || ''}
                            onChange={(e) => setLocalPreferences({ ...localPreferences, name: e.target.value })}
                            placeholder="Your Name"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <input
                            type="text"
                            value={localPreferences.position || ''}
                            onChange={(e) => setLocalPreferences({ ...localPreferences, position: e.target.value })}
                            placeholder="Your Position"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <input
                            type="text"
                            value={localPreferences.company || ''}
                            onChange={(e) => setLocalPreferences({ ...localPreferences, company: e.target.value })}
                            placeholder="Company Name"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <input
                            type="text"
                            value={localPreferences.contact || ''}
                            onChange={(e) => setLocalPreferences({ ...localPreferences, contact: e.target.value })}
                            placeholder="Email | Phone"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 group disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium">Save Persona</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}