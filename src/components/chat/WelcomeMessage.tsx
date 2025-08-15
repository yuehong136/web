import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Search, FileText, Image, Code } from "lucide-react";

export function WelcomeMessage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-2xl p-8 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">👋 欢迎使用 MCP 实验场</h1>
          <p className="text-muted-foreground">
            我可以帮助你解答问题，并使用强大的MCP工具获取实时信息
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-muted rounded-lg text-left">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span>MCP工具集成</span>
              <Badge variant="secondary">新功能</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              点击顶部的"MCP工具"按钮选择和配置工具服务器，享受更强大的AI助手体验。
              支持网页搜索、文档查询、图片处理等多种功能。
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium mb-1 flex items-center gap-2">
                <Search className="w-4 h-4" />
                网页搜索
              </div>
              <div className="text-muted-foreground">
                实时搜索网络信息和最新资讯
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                文档查询
              </div>
              <div className="text-muted-foreground">
                查询技术文档和API参考
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium mb-1 flex items-center gap-2">
                <Image className="w-4 h-4" />
                图片处理
              </div>
              <div className="text-muted-foreground">
                搜索图片和截图网页
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium mb-1 flex items-center gap-2">
                <Code className="w-4 h-4" />
                学术搜索
              </div>
              <div className="text-muted-foreground">
                搜索arXiv学术论文
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground border-t pt-4">
          💡 提示：试试问我"Docker的最新介绍"来体验MCP工具的强大功能
        </div>
      </Card>
    </div>
  );
}