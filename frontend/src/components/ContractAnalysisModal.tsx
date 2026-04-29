"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Sparkles,
  RefreshCw,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Contrato } from "@/types/api";
import { useContractAnalysis } from "@/hooks/useContractAnalysis";
import ReactMarkdown from "react-markdown";

interface ContractAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: Contrato | null;
}

export default function ContractAnalysisModal({
  isOpen,
  onClose,
  contrato,
}: ContractAnalysisModalProps) {
  const [mounted, setMounted] = useState(false);
  const [additionalText, setAdditionalText] = useState("");
  const [copied, setCopied] = useState(false);
  const { analyzing, analysis, error, analyzeContract, clearAnalysis } =
    useContractAnalysis();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && contrato) {
      // Iniciar análise automaticamente quando o modal abre
      analyzeContract(contrato);
    }
    if (!isOpen) {
      clearAnalysis();
      setAdditionalText("");
    }
  }, [isOpen, contrato]);

  const handleReanalyze = () => {
    if (contrato) {
      analyzeContract(contrato, additionalText);
    }
  };

  const handleCopy = async () => {
    if (analysis) {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (analysis && contrato) {
      const blob = new Blob([analysis], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analise-contrato-${contrato.id}-${
        new Date().toISOString().split("T")[0]
      }.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPDF = async () => {
    if (!analysis || !contrato) return;

    try {
      // Criar um elemento temporário para renderizar o conteúdo
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "800px";
      tempDiv.style.padding = "40px";
      tempDiv.style.backgroundColor = "#ffffff";
      tempDiv.style.color = "#000000";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.style.lineHeight = "1.6";

      // Adicionar cabeçalho
      const clienteNome =
        contrato.cliente?.pessoaFisica?.nome ||
        contrato.cliente?.pessoaJuridica?.razaoSocial ||
        "Cliente";

      tempDiv.innerHTML = `
        <div style="border-bottom: 3px solid #9333ea; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #9333ea; margin: 0; font-size: 24px; font-weight: bold;">
            Análise de Contrato com IA
          </h1>
          <p style="margin: 10px 0 5px 0; color: #666; font-size: 14px;">
            <strong>Cliente:</strong> ${clienteNome}
          </p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            <strong>Contrato:</strong> #${contrato.id}
          </p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            <strong>Data da Análise:</strong> ${new Date().toLocaleDateString(
              "pt-BR"
            )}
          </p>
        </div>
        <div class="markdown-content" style="color: #000;">
          ${analysis
            .replace(
              /^# (.+)$/gm,
              '<h1 style="color: #9333ea; font-size: 20px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h1>'
            )
            .replace(
              /^## (.+)$/gm,
              '<h2 style="color: #9333ea; font-size: 16px; margin: 20px 0 12px 0;">$1</h2>'
            )
            .replace(
              /^### (.+)$/gm,
              '<h3 style="color: #333; font-size: 14px; margin: 15px 0 10px 0; font-weight: bold;">$1</h3>'
            )
            .replace(
              /\*\*(.+?)\*\*/g,
              '<strong style="color: #000;">$1</strong>'
            )
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(
              /^- (.+)$/gm,
              '<li style="margin: 5px 0; margin-left: 20px;">$1</li>'
            )
            .replace(
              /^\d+\. (.+)$/gm,
              '<li style="margin: 5px 0; margin-left: 20px; list-style-type: decimal;">$1</li>'
            )
            .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
            .replace(/^(?!<[hl]|<li)/gm, '<p style="margin: 10px 0;">')}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 10px;">
          <p>Análise gerada por IA via GPT-4 • LangChain.js • CRM JURÍDICO Arrighi</p>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Capturar o elemento como canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remover elemento temporário
      document.body.removeChild(tempDiv);

      // Criar PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      pdf.save(
        `analise-contrato-${contrato.id}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  if (!mounted) return null;

  const clienteNome =
    contrato?.cliente?.pessoaFisica?.nome ||
    contrato?.cliente?.pessoaJuridica?.razaoSocial ||
    "Cliente";

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="analysis-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="analysis-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
          >
            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg shadow-purple-500/30">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                      Análise de Contrato com IA
                    </h2>
                    <p className="text-sm text-neutral-400">
                      {clienteNome} • Contrato #{contrato?.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {/* Loading State */}
                {analyzing && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                      <Sparkles className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-200 mt-6">
                      Analisando contrato...
                    </h3>
                    <p className="text-neutral-400 text-sm mt-2">
                      A IA está processando as informações do contrato
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !analyzing && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 bg-red-500/20 rounded-full">
                      <AlertTriangle className="w-12 h-12 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-200 mt-6">
                      Erro na análise
                    </h3>
                    <p className="text-red-400 text-sm mt-2 text-center max-w-md">
                      {error}
                    </p>
                    <button
                      onClick={handleReanalyze}
                      className="mt-6 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* Analysis Result */}
                {analysis && !analyzing && (
                  <div className="space-y-6">
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Análise concluída
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? "Copiado!" : "Copiar"}
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={handleDownloadMarkdown}
                          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Markdown
                        </button>
                        <button
                          onClick={handleReanalyze}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reanalisar
                        </button>
                      </div>
                    </div>

                    {/* Additional Text Input */}
                    <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Texto adicional para análise (opcional)
                      </label>
                      <textarea
                        value={additionalText}
                        onChange={(e) => setAdditionalText(e.target.value)}
                        placeholder="Cole aqui o texto do contrato, cláusulas específicas ou informações adicionais..."
                        className="w-full h-24 px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Markdown Content */}
                    <div className="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50">
                      <div
                        className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-neutral-100 prose-headings:font-semibold
                        prose-h1:text-2xl prose-h1:border-b prose-h1:border-neutral-700 prose-h1:pb-2
                        prose-h2:text-xl prose-h2:text-purple-400 prose-h2:mt-6
                        prose-h3:text-lg prose-h3:text-neutral-200
                        prose-p:text-neutral-300 prose-p:leading-relaxed
                        prose-strong:text-neutral-100 prose-strong:font-semibold
                        prose-ul:text-neutral-300
                        prose-ol:text-neutral-300
                        prose-li:marker:text-purple-400
                        prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                        prose-code:text-pink-400 prose-code:bg-neutral-800 prose-code:px-1 prose-code:rounded
                        prose-blockquote:border-l-purple-500 prose-blockquote:bg-neutral-800/50 prose-blockquote:text-neutral-300
                      "
                      >
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-500 text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>I.A JURÍDICO Arrighi</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
