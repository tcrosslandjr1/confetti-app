import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRightLeft, Copy, Check, Loader2, Languages, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translateText } from "@/lib/translate.functions";

export const Route = createLazyFileRoute("/translate")({
  component: TranslatePage,
});

const LANGUAGES = [
    "Auto-detect",
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Dutch",
    "Polish",
    "Swedish",
    "Russian",
    "Ukrainian",
    "Turkish",
    "Arabic",
    "Hebrew",
    "Hindi",
    "Bengali",
    "Japanese",
    "Korean",
    "Chinese (Simplified)",
    "Chinese (Traditional)",
    "Vietnamese",
    "Thai",
    "Indonesian",
    "Greek",
    "Czech",
    "Romanian",
    "Hungarian",
    "Finnish",
    "Norwegian",
    "Danish",
];

const TONES = [
    { value: "natural", label: "Natural" },
    { value: "formal", label: "Formal" },
    { value: "casual", label: "Casual" },
    { value: "literal", label: "Literal" },
] as const;

function TranslatePage() {
    const [source, setSource] = useState("Auto-detect");
    const [target, setTarget] = useState("Spanish");
    const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("natural");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);
    const translateFn = useServerFn(translateText);
    const mut = useMutation({
        mutationFn: async () => {
            const res = await translateFn({
                data: {
                    text: input,
                    targetLanguage: target,
                    sourceLanguage: source === "Auto-detect" ? undefined : source,
                    tone,
                },
            });
            return res.translation;
        },
        onSuccess: (t) => {
            setOutput(t);
            setCopied(false);
        },
    });
    const charCount = input.length;
    const canSubmit = useMemo(() => input.trim().length > 0 && target.length > 0 && !mut.isPending, [input, target, mut.isPending]);
    function swap() {
        if (source === "Auto-detect")
            return;
        setSource(target);
        setTarget(source);
        setInput(output);
        setOutput(input);
    }
    function copyOutput() {
        if (!output)
            return;
        navigator.clipboard.writeText(output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }
    return (<main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-8 space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Languages className="h-3.5 w-3.5"/>
          AI Translator
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Translate anything, instantly
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Paste text, pick a language, and get a natural translation in seconds. Powered by Lovable
          AI.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (<SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-center pb-1">
            <Button type="button" variant="ghost" size="icon" onClick={swap} disabled={source === "Auto-detect"} aria-label="Swap languages" title={source === "Auto-detect" ? "Pick a source language to swap" : "Swap languages"}>
              <ArrowRightLeft className="h-4 w-4"/>
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter((l) => l !== "Auto-detect").map((l) => (<SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="input" className="text-xs">
                Original
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {charCount.toLocaleString()} / 5,000
              </span>
            </div>
            <Textarea id="input" value={input} onChange={(e) => setInput(e.target.value.slice(0, 5000))} placeholder="Type or paste text to translate…" rows={10} className="resize-none"/>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="output" className="text-xs">
                Translation
              </Label>
              <Button type="button" size="sm" variant="ghost" onClick={copyOutput} disabled={!output} className="h-7 gap-1.5 px-2 text-xs">
                {copied ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea id="output" value={output} readOnly placeholder={mut.isPending ? "Translating…" : "Your translation will appear here."} rows={10} className="resize-none bg-muted/30"/>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (<SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" size="lg" onClick={() => mut.mutate()} disabled={!canSubmit} className="sm:min-w-[180px]">
            {mut.isPending ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Translating…
              </>) : ("Translate")}
          </Button>
        </div>

        {mut.isError && (<p className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5"/>
            {(mut.error as Error).message}
          </p>)}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Translations are AI-generated and may contain errors. Review important text before relying
        on it.
      </p>
    </main>);
}
