import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { voiceInputButtonStyles } from '../styles/voice-input-button.js';
import { globalConfig } from '../config/global-config.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import iconMicOff from '../../public/svg/mic-icon.svg?raw';
import iconMicOn from '../../public/svg/mic-record-on-icon.svg?raw';

@customElement('voice-input-button')
export class VoiceInputButton extends LitElement {
  // some browsers may not support SpeechRecognition https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility
  @state()
  showVoiceInput = (window.SpeechRecognition || window.webkitSpeechRecognition) !== undefined;

  @state()
  enableVoiceListening = false;

  speechRecognition: SpeechRecognition | undefined = undefined;

  static override styles = [voiceInputButtonStyles];

  initializeSpeechRecognition(): void {
    if (this.showVoiceInput) {
      this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

      if (!this.speechRecognition) {
        return; // no speech support found so do nothing
      }

      this.speechRecognition.continuous = true;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event) => {
        let input = '';
        for (const result of event.results) {
          input += `${result[0].transcript}`;
        }

        // dispatch event
        const voiceInputEvent = new CustomEvent('on-voice-input', {
          detail: {
            input,
          },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(voiceInputEvent);
      };

      this.speechRecognition.addEventListener('error', (event) => {
        if (this.speechRecognition) {
          this.speechRecognition.stop();
          console.log(`Speech recognition error detected: ${event.error} - ${event.message}`);
        }
      });
    }
  }

  handleVoiceInput(event: Event): void {
    event.preventDefault();
    if (!this.speechRecognition) {
      this.initializeSpeechRecognition();
    }

    if (this.speechRecognition) {
      this.enableVoiceListening = !this.enableVoiceListening;
      if (this.enableVoiceListening) {
        this.speechRecognition.start();
      } else {
        this.speechRecognition.stop();
      }
    }
  }

  renderVoiceButton() {
    return html`
      <button
        title="${this.enableVoiceListening
          ? globalConfig.CHAT_VOICE_REC_BUTTON_LABEL_TEXT
          : globalConfig.CHAT_VOICE_BUTTON_LABEL_TEXT}"
        class="voice-input-button ${this.enableVoiceListening ? 'recording' : 'not-recording'}"
        @click="${this.handleVoiceInput}"
      >
        ${this.enableVoiceListening ? unsafeSVG(iconMicOn) : unsafeSVG(iconMicOff)}
      </button>
    `;
  }

  override render() {
    return this.showVoiceInput ? this.renderVoiceButton() : html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'voice-input-button': VoiceInputButton;
  }
}
