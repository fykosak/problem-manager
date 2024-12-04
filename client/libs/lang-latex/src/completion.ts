import { CompletionContext, CompletionResult, completeFromList } from "@codemirror/autocomplete"
import { latexLanguage } from "./language";
import { syntaxTree } from "@codemirror/language";

const greekSymbols = [
	["alpha", "α"],
	["beta", "β"],
	["gamma", "γ"],
	["Gamma", "Γ"],
	["delta", "δ"],
	["Delta", "∆"],
	["epsilon", "ε"],
	["varepsilon", "ε"],
	["zeta", "ζ"],
	["eta", "η"],
	["theta", "θ"],
	["Theta", "Θ"],
	["vartheta", "ϑ"],
	["iota", "ι"],
	["kappa", "κ"],
	["lambda", "λ"],
	["Lambda", "Λ"],
	["mu", "μ"],
	["nu", "ν"],
	["xi", "ξ"],
	["Xi", "Ξ"],
	["pi", "π"],
	["Pi", "Π"],
	["rho", "ρ"],
	["varrho", "ϱ"],
	["sigma", "σ"],
	["Sigma", "Σ"],
	["varsigma", "ς"],
	["tau", "τ"],
	["upsilon", "υ"],
	["Upsilon", "Υ"],
	["phi", "φ"],
	["Phi", "Φ"],
	["varphi", "ϕ"],
	["chi", "χ"],
	["psi", "ψ"],
	["Psi", "Ψ"],
	["omega", "ω"],
	["Omega", "Ω"]
]

const relationSymbols = [
	["nless", "≮"],
	["leq", "≤"],
	["leqslant", "⩽"],
	["nleq", "≰"],
	["nleqslant", "⪇"],
	["prec", "≺"],
	["nprec", "⊀"],
	["preceq", "⪯"],
	["npreceq", "⋠"],
	["ll", "≪"],
	["lll", "⋘"],
	["subset", "⊂"],
	["not\\subset", "⊄"],
	["subseteq", "⊆"],
	["nsubseteq", "⊈"],
	["sqsubset", "⊏"],
	["sqsubseteq", "⊑"],
	["ngtr", "≯"],
	["geq", "≥"],
	["geqslant", "⩾"],
	["ngeq", "≱"],
	["ngeqslant", "⪈"],
	["succ", "≻"],
	["nsucc", "⊁"],
	["succeq", "⪰"],
	["nsucceq", "⋡"],
	["gg", "≫"],
	["ggg", "⋙"],
	["supset", "⊃"],
	["not\\supset", "⊅"],
	["supseteq", "⊇"],
	["nsupseteq", "⊉"],
	["sqsupset", "⊐"],
	["sqsupseteq", "⊒"],
	["doteq", "≐"],
	["equiv", "≡"],
	["approx", "≈"],
	["cong", "≅"],
	["simeq", "≃"],
	["sim", "∼"],
	["propto", "∝"],
	["neq", "≠"],
	["parallel", "∥"],
	["asymp", "≍"],
	["vdash", "⊢"],
	["in", "∈"],
	["smile", "⌣"],
	["models", "⊨"],
	["perp", "⊥"],
	["nparallel", "∦"],
	["bowtie", "⋈"],
	["dashv", "⊣"],
	["ni", "∋"],
	["frown", "⌢"],
	["notin", "∉"],
	["mid", "∣"],
]

const binaryOperators = [
	["pm", "±"],
	["mp", "∓"],
	["times", "×"],
	["div", "÷"],
	["ast", "∗"],
	["star", "⋆"],
	["dagger", "†"],
	["ddagger", "‡"],
	["cap", "∩"],
	["cup", "∪"],
	["uplus", "⊎"],
	["sqcap", "⊓"],
	["sqcup", "⊔"],
	["vee", "∨"],
	["wedge", "∧"],
	["cdot", "⋅"],
	["diamond", "⋄"],
	["bigtriangleup", "△"],
	["bigtriangledown", "▽"],
	["triangleleft", "◃"],
	["triangleright", "▹"],
	["bigcirc", "◯"],
	["bullet", "∙"],
	["wr", "≀"],
	["oplus", "⊕"],
	["ominus", "⊖"],
	["otimes", "⊗"],
	["oslash", "⊘"],
	["odot", "⊙"],
	["circ", "∘"],
	["setminus", "∖"],
	["amalg", "⨿"]
]

const negatedBinaryOperators = [
	["nless", "≮"],
	["nleq", "≰"],
	["nleqslant", "⪇"],
	["nleqq", "≰"],
	["lneq", "⪇"],
	["lneqq", "≨"],
	["lvertneqq", "≨"],
	["lnsim", "⋦"],
	["lnapprox", "⪉"],
	["nprec", "⊀"],
	["npreceq", "⋠"],
	["precneqq", "⪵"],
	["precnsim", "⋨"],
	["precnapprox", "⪹"],
	["nsim", "≁"],
	["nshortmid", "∤"],
	["nmid", "∤"],
	["nvdash", "⊬"],
	["nVdash", "⊮"],
	["ntriangleleft", "⋪"],
	["ntrianglelefteq", "⋬"],
	["nsubseteq", "⊈"],
	["nsubseteqq", "⊈"],
	["subsetneq", "⊊"],
	["varsubsetneq", "⊊"],
	["subsetneqq", "⫋"],
	["varsubsetneqq", "⫋"],
	["notin", "∉"],
	["ngtr", "≯"],
	["ngeq", "≱"],
	["ngeqslant", "⪈"],
	["ngeqq", "≱"],
	["gneq", "⪈"],
	["gneqq", "≩"],
	["gvertneqq", "≩"],
	["gnsim", "⋧"],
	["gnapprox", "⪊"],
	["nsucc", "⊁"],
	["nsucceq", "⋡"],
	["succneqq", "⪶"],
	["succnsim", "⋩"],
	["succnapprox", "⪺"],
	["ncong", "≆"],
	["nshortparallel", "∦"],
	["nparallel", "∦"],
	["nvDash", "⊭"],
	["nVDash", "⊯"],
	["ntriangleright", "⋫"],
	["ntrianglerighteq", "⋭"],
	["nsupseteq", "⊉"],
	["nsupseteqq", "⊉"],
	["supsetneq", "⊋"],
	["varsupsetneq", "⊋"],
	["supsetneqq", "⫌"],
	["varsupsetneqq", "⫌"]
]

const setAndLogicSymbols = [
	["emptyset", "∅"],
	["varnothing, ∅"],
	["N, N"],
	["Z, Z"],
	["Q, Q"],
	["mathbb{A}, A"],
	["R", "R"],
	["C", "C"],
	["mathbb{H}", "H"],
	["mathbb{O}", "O"],
	["mathbb{S}", "S"],
	["subset", "⊂"],
	["subseteq", "⊆"],
	["supset", "⊃"],
	["supseteq", "⊇"],
	["cup", "∪"],
	["cap", "∩"],
	["setminus", "∖"],
	["exists", "∃"],
	["exists!", "∃!"],
	["nexists", "∄"],
	["forall", "∀"],
	["neg", "¬"],
	["lor", "∨"],
	["land", "∧"],
	["implies", "⟹"],
	["iff", "⟺"],
	["top", "⊤"],
	["bot", "⊥"],
]

const delimiterSymbols = [
	["{", "{"],
	["lceil", "⌈"],
	["ulcorner", "⌜"],
	["|", "‖"],
	["}", "}"],
	["rceil", "⌉"],
	["urcorner", "⌝"],
	["langle", "⟨"],
	["lfloor", "⌊"],
	["llcorner", "⌞"],
	["backslash", "∖"],
	["rangle", "⟩"],
	["rfloor", "⌋"],
	["lrcorner", "⌟"],
]

const arrowSymbols = [
	["rightarrow", "→"],
	["to", "→"],
	["Rightarrow", "⇒"],
	["leftarrow", "←"],
	["gets", "←"],
	["Leftarrow", "⇐"],
	["mapsto", "↦"],
	["longmapsto", "⟼"],
	["longrightarrow", "⟶"],
	["longleftarrow", "⟵"],
	["Longrightarrow", "⟹"],
	["Longleftarrow", "⟸"],
	["uparrow", "↑"],
	["downarrow", "↓"],
	["updownarrow", "↕"],
	["Uparrow", "⇑"],
	["Downarrow", "⇓"],
	["Updownarrow", "⇕"],
]

function getMathCompletion(context: CompletionContext): CompletionResult | null {
	const node = syntaxTree(context.state).resolve(context.pos, -1).cursor();

	const cursorPosition = node.from;

	// traverse tree to the top to find math node
	while (true) {
		if (node.name == "InlineMath") {
			break;
		}

		if (!node.parent()) {
			return null;
		}
	}

	// got to the top of the tree
	const greekCommands = greekSymbols.concat(
		relationSymbols,
		binaryOperators,
		negatedBinaryOperators,
		setAndLogicSymbols,
		delimiterSymbols,
		arrowSymbols
	).map(symbol => ({
		label: "\\" + symbol[0],
		type: "keyword",
		detail: symbol[1]
	}))

	return {
		from: cursorPosition,
		options: greekCommands
	}
}

export const mathCompletion = latexLanguage.data.of({
	autocomplete: getMathCompletion
})

export const basicCompletion = latexLanguage.data.of({
	autocomplete: completeFromList([
		{ label: "\\frac{}{}", type: "keyword" },
	]),
})
