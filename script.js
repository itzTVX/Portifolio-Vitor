const CHAVE_TEMA = "tema-portfolio";
const raiz = document.documentElement;
const preferePouco = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let elementoAntesDoModal = null;

/*
  Lê o tema salvo no localStorage. Se não houver preferência (ou o
  navegador bloquear o acesso), devolve "dark", o tema padrão do site.
*/
function lerTemaSalvo() {
  try {
    return localStorage.getItem(CHAVE_TEMA) === "light" ? "light" : "dark";
  } catch (erro) {
    return "dark";
  }
}

/*
  Aplica o tema no <html> (o CSS troca as cores pelas variáveis) e
  atualiza o texto do botão para indicar qual tema será ativado no próximo clique.
*/
function aplicarTema(tema) {
  raiz.setAttribute("data-theme", tema);
  const botao = document.getElementById("botao-tema");
  if (botao) {
    botao.setAttribute("aria-label", tema === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro");
  }
}

/*
  Alterna entre claro e escuro, salva a escolha no localStorage e
  ativa uma transição de cor de 300 ms (desligada se o usuário prefere menos movimento).
*/
function alternarTema() {
  const novoTema = raiz.getAttribute("data-theme") === "dark" ? "light" : "dark";
  if (!preferePouco) {
    raiz.classList.add("tema-transicao");
    setTimeout(() => raiz.classList.remove("tema-transicao"), 350);
  }
  aplicarTema(novoTema);
  try {
    localStorage.setItem(CHAVE_TEMA, novoTema);
  } catch (erro) {
    console.warn("Não foi possível salvar o tema.", erro);
  }
}

/*
  Abre ou fecha o menu hambúrguer no celular e mantém o atributo
  aria-expanded sincronizado para leitores de tela.
*/
function alternarMenu(forcarFechar = false) {
  const menu = document.getElementById("menu");
  const botao = document.getElementById("botao-menu");
  const abrir = !forcarFechar && !menu.classList.contains("aberto");
  menu.classList.toggle("aberto", abrir);
  botao.setAttribute("aria-expanded", String(abrir));
  botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
}

/*
  Usa o Intersection Observer para revelar cada seção (classe "visivel")
  quando ela entra na tela. Sem suporte ao recurso, mostra tudo de imediato.
*/
function iniciarAnimacoesDeEntrada() {
  const secoes = document.querySelectorAll(".revelar");
  if (!("IntersectionObserver" in window) || preferePouco) {
    secoes.forEach((secao) => secao.classList.add("visivel"));
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });
  secoes.forEach((secao) => observador.observe(secao));
}

/*
  Quando uma imagem não carrega (por exemplo, a foto ainda não foi
  adicionada à pasta assets/img), troca a imagem por um quadro com o
  texto definido em data-fallback, evitando o ícone de imagem quebrada.
*/
function tratarImagensAusentes() {
  document.querySelectorAll("img[data-fallback]").forEach((imagem) => {
    const trocar = () => {
      const quadro = document.createElement("div");
      quadro.className = "sem-foto";
      quadro.textContent = imagem.dataset.fallback;
      quadro.setAttribute("role", "img");
      quadro.setAttribute("aria-label", imagem.alt);
      imagem.replaceWith(quadro);
    };
    if (imagem.complete && imagem.naturalWidth === 0) trocar();
    else imagem.addEventListener("error", trocar, { once: true });
  });
}

/*
  Aplica a máscara brasileira no telefone: (31) 97177-2768 para
  celulares e (31) 3333-4444 para fixos. Remove letras e símbolos,
  limita a 11 dígitos e aceita números digitados com ou sem formatação.
*/
function mascararTelefone(campo) {
  const numeros = campo.value.replace(/\D/g, "").slice(0, 11);
  let texto = numeros;
  if (numeros.length > 10) {
    texto = numeros.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
  } else if (numeros.length > 6) {
    texto = numeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (numeros.length > 2) {
    texto = numeros.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else if (numeros.length > 0) {
    texto = "(" + numeros;
  }
  campo.value = texto;
}

/*
  Regras de validação de cada campo. Cada função recebe o valor e
  devolve uma mensagem de erro, ou uma string vazia quando o valor é válido.
*/
const validadores = {
  nome(valor) {
    if (!valor) return "Informe seu nome.";
    if (valor.length < 3) return "Digite seu nome com pelo menos 3 letras.";
    if (/\d/.test(valor)) return "O nome não pode ter números.";
    return "";
  },
  telefone(valor) {
    const numeros = valor.replace(/\D/g, "");
    if (!numeros) return "Informe seu telefone.";
    if (numeros.length < 10 || numeros.length > 11) return "Digite o DDD e o número, por exemplo (31) 91234-5678.";
    if (numeros.length === 11 && numeros[2] !== "9") return "Celulares começam com 9 depois do DDD.";
    return "";
  },
  email(valor) {
    if (!valor) return "Informe seu e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return "Digite um e-mail válido, como nome@exemplo.com.";
    return "";
  },
  mensagem(valor) {
    if (!valor) return "Escreva uma mensagem.";
    if (valor.length < 10) return "A mensagem precisa ter pelo menos 10 caracteres.";
    return "";
  }
};

/*
  Valida um único campo: limpa espaços das pontas, mostra a mensagem
  de erro, marca o campo como inválido (aria-invalid e cor) e
  devolve true quando o valor está correto.
*/
function validarCampo(campo) {
  campo.value = campo.value.trim();
  const mensagem = validadores[campo.name](campo.value);
  const area = campo.closest(".campo");
  document.getElementById("erro-" + campo.name).textContent = mensagem;
  campo.setAttribute("aria-invalid", String(Boolean(mensagem)));
  area.classList.toggle("invalido", Boolean(mensagem));
  area.classList.toggle("valido", !mensagem);
  return !mensagem;
}

/*
  Trata o envio do formulário. Valida todos os campos, foca o primeiro
  com erro e, se tudo estiver certo, abre o modal. Como o site é
  estático, nada é enviado: o modal explica isso com honestidade.
*/
function tratarEnvio(evento) {
  evento.preventDefault();
  const formulario = evento.target;
  const campos = Array.from(formulario.querySelectorAll("input, textarea"));
  const resultados = campos.map(validarCampo);
  const primeiroInvalido = campos[resultados.indexOf(false)];
  if (primeiroInvalido) {
    primeiroInvalido.focus();
    return;
  }
  abrirModal(
    "Dados validados",
    "Todos os campos estão corretos, mas esta página é estática e não tem um serviço para receber mensagens, então nada foi enviado. Para falar comigo agora, use o WhatsApp ou o GitHub."
  );
  formulario.reset();
  campos.forEach((campo) => {
    campo.removeAttribute("aria-invalid");
    campo.closest(".campo").classList.remove("valido", "invalido");
  });
}

/*
  Abre o modal com título e texto, guarda o elemento que estava em
  foco para devolver o foco depois e move o foco para dentro do modal.
*/
function abrirModal(titulo, texto) {
  const modal = document.getElementById("modal");
  elementoAntesDoModal = document.activeElement;
  document.getElementById("modal-titulo").textContent = titulo;
  document.getElementById("modal-texto").textContent = texto;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("modal-fechar").focus();
}

/*
  Fecha o modal, libera a rolagem da página e devolve o foco ao
  elemento que abriu o modal.
*/
function fecharModal() {
  const modal = document.getElementById("modal");
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  if (elementoAntesDoModal) elementoAntesDoModal.focus();
}

/*
  Trata o teclado com o modal aberto: Escape fecha e Tab fica preso
  entre os botões do modal, para o foco não escapar para a página.
*/
function tratarTecladoNoModal(evento) {
  const modal = document.getElementById("modal");
  if (modal.hidden) return;
  if (evento.key === "Escape") {
    fecharModal();
  } else if (evento.key === "Tab") {
    const focaveis = modal.querySelectorAll("button, a[href]");
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }
}

/*
  Cria uma barra fina no topo da tela que cresce conforme a página é
  rolada. Usa requestAnimationFrame para atualizar no máximo uma vez
  por quadro e não pesar a rolagem.
*/
function iniciarBarraDeProgresso() {
  const barra = document.createElement("div");
  barra.className = "progresso";
  barra.setAttribute("aria-hidden", "true");
  document.body.appendChild(barra);
  let aguardando = false;
  const atualizar = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = "scaleX(" + (total > 0 ? window.scrollY / total : 0) + ")";
    aguardando = false;
  };
  window.addEventListener("scroll", () => {
    if (!aguardando) {
      aguardando = true;
      requestAnimationFrame(atualizar);
    }
  }, { passive: true });
  atualizar();
}

/*
  Guarda a posição do mouse dentro de cada card nas variáveis CSS
  --mx e --my. O CSS usa esses valores para desenhar um brilho suave
  que acompanha o cursor (só aparece em telas com mouse).
*/
function iniciarBrilhoNosCartoes() {
  document.querySelectorAll(".cartao, .projeto").forEach((cartao) => {
    cartao.addEventListener("mousemove", (evento) => {
      const caixa = cartao.getBoundingClientRect();
      cartao.style.setProperty("--mx", (evento.clientX - caixa.left) + "px");
      cartao.style.setProperty("--my", (evento.clientY - caixa.top) + "px");
    });
  });
}

/*
  Liga todos os eventos da página (botões, formulário, modal, menu)
  depois que o HTML terminou de carregar. Usa try/catch para que um
  erro inesperado não quebre o restante do site.
*/
function iniciarSite() {
  try {
    raiz.classList.add("js");
    aplicarTema(lerTemaSalvo());
    document.getElementById("ano").textContent = new Date().getFullYear();
    document.getElementById("botao-tema").addEventListener("click", alternarTema);
    document.getElementById("botao-menu").addEventListener("click", () => alternarMenu());
    document.querySelectorAll("#menu a").forEach((link) => link.addEventListener("click", () => alternarMenu(true)));

    const formulario = document.getElementById("formulario");
    const telefone = document.getElementById("telefone");
    formulario.addEventListener("submit", tratarEnvio);
    telefone.addEventListener("input", () => mascararTelefone(telefone));
    formulario.querySelectorAll("input, textarea").forEach((campo) => {
      campo.addEventListener("blur", () => validarCampo(campo));
      campo.addEventListener("input", () => {
        if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
      });
    });

    const botaoDetalhes = document.getElementById("botao-detalhes-cs");
    if (botaoDetalhes) {
      botaoDetalhes.addEventListener("click", () => abrirModal(
        "Atividade 1, 3ª etapa (C#)",
        "Aplicativo de console. Pede três números e, se algum for negativo, mostra um aviso e pede tudo de novo. Com números válidos, exibe a soma, a média, o maior e o menor valor. O código usa um método para cada cálculo."
      ));
    }
    document.getElementById("modal-fechar").addEventListener("click", fecharModal);
    document.getElementById("modal").addEventListener("click", (evento) => {
      if (evento.target.id === "modal") fecharModal();
    });
    document.addEventListener("keydown", tratarTecladoNoModal);

    tratarImagensAusentes();
    iniciarAnimacoesDeEntrada();
    iniciarBarraDeProgresso();
    iniciarBrilhoNosCartoes();
  } catch (erro) {
    console.error("Erro ao iniciar o site:", erro);
    document.querySelectorAll(".revelar").forEach((secao) => secao.classList.add("visivel"));
  }
}

aplicarTema(lerTemaSalvo());
document.addEventListener("DOMContentLoaded", iniciarSite);
