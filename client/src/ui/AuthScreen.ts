import type { UserPublic } from '@shared/types';
import { EventBus } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';

type AuthMode = 'login' | 'register';

export class AuthScreen {
  private container: HTMLElement;
  private mode: AuthMode = 'login';
  private isSubmitting = false;

  constructor(private parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'auth-screen';
    this.container.className = 'auth-overlay ui-interactive';
    this.parent.appendChild(this.container);
  }

  async init(): Promise<void> {
    this.renderLoading();
    const user = await SaveManager.getSession();
    if (user) {
      await this.completeAuth(user);
      return;
    }
    this.renderForm();
  }

  show(): void {
    this.container.style.display = 'flex';
    this.renderForm();
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="auth-card">
        <h1 class="auth-title">O Despertar de São Tomé dos Números</h1>
        <p class="auth-subtitle">Verificando sessão mágica...</p>
      </div>
    `;
  }

  private renderForm(errorMessage = ''): void {
    const isRegister = this.mode === 'register';
    this.container.innerHTML = `
      <div class="auth-card">
        <div class="auth-crest">✦</div>
        <h1 class="auth-title">O Despertar de São Tomé dos Números</h1>
        <p class="auth-subtitle">
          ${
            isRegister
              ? 'Crie sua conta com e-mail para iniciar e salvar sua fazenda mágica.'
              : 'Entre com seu e-mail para continuar sua jornada.'
          }
        </p>

        <div class="auth-tabs">
          <button type="button" class="auth-tab ${!isRegister ? 'active' : ''}" data-mode="login">
            Entrar
          </button>
          <button type="button" class="auth-tab ${isRegister ? 'active' : ''}" data-mode="register">
            Criar Conta
          </button>
        </div>

        <form id="auth-form" class="auth-form">
          ${
            isRegister
              ? `<label class="auth-label">
                  Nome do(a) Bruxo(a)
                  <input type="text" id="auth-name" placeholder="Ex: Tomé" maxlength="40" />
                </label>`
              : ''
          }
          <label class="auth-label">
            E-mail
            <input type="email" id="auth-email" required placeholder="seu@email.com" autocomplete="email" />
          </label>
          <label class="auth-label">
            Senha (mínimo 6 caracteres)
            <input type="password" id="auth-password" required minlength="6" placeholder="••••••" autocomplete="${
              isRegister ? 'new-password' : 'current-password'
            }" />
          </label>

          ${errorMessage ? `<p class="auth-error">${errorMessage}</p>` : ''}

          <button type="submit" class="auth-submit" ${this.isSubmitting ? 'disabled' : ''}>
            ${
              this.isSubmitting
                ? 'Conectando...'
                : isRegister
                  ? 'Criar Conta e Começar'
                  : 'Entrar no Mundo'
            }
          </button>
        </form>
      </div>
    `;

    this.container.querySelectorAll<HTMLButtonElement>('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMode = btn.dataset.mode as AuthMode | undefined;
        if (nextMode && nextMode !== this.mode) {
          this.mode = nextMode;
          this.renderForm();
        }
      });
    });

    const form = this.container.querySelector<HTMLFormElement>('#auth-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.handleSubmit();
    });
  }

  private async handleSubmit(): Promise<void> {
    if (this.isSubmitting) return;
    const emailInput = this.container.querySelector<HTMLInputElement>('#auth-email');
    const passwordInput = this.container.querySelector<HTMLInputElement>('#auth-password');
    const nameInput = this.container.querySelector<HTMLInputElement>('#auth-name');

    const email = emailInput?.value.trim() ?? '';
    const password = passwordInput?.value ?? '';
    const displayName = nameInput?.value.trim() ?? '';

    this.isSubmitting = true;
    this.renderForm();

    try {
      const user =
        this.mode === 'register'
          ? await SaveManager.register(email, password, displayName || undefined)
          : await SaveManager.login(email, password);
      await this.completeAuth(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível autenticar.';
      this.isSubmitting = false;
      this.renderForm(msg);
    }
  }

  private async completeAuth(user: UserPublic): Promise<void> {
    try {
      const save = await SaveManager.loadSave('principal');
      this.isSubmitting = false;
      this.hide();
      EventBus.emit('AUTH_AUTHENTICATED', {
        user,
        save: save ? save.state : null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar save.';
      this.isSubmitting = false;
      this.renderForm(msg);
    }
  }
}

