import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "CustomUI.ResPicker",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "InteractiveResPicker") {
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                
                const node = this;
                let isDragging = false;
                
                const MAX_RES = 4096;
                const MIN_RES = 64;
                const PADDING = { left: 45, right: 15, top: 140, bottom: 35 };

                // Override computeSize
                const origComputeSize = nodeType.prototype.computeSize;
                nodeType.prototype.computeSize = function() {
                    return [320, 380];
                };

                node.onDrawForeground = function (ctx) {
                    if (this.flags.collapsed) return;

                    const wWidget = node.widgets.find(w => w.name === "width");
                    const hWidget = node.widgets.find(w => w.name === "height");
                    const divWidget = node.widgets.find(w => w.name === "divide_by");

                    if (!wWidget || !hWidget) return;

                    const currentW = wWidget.value;
                    const currentH = hWidget.value;
                    const div = Math.max(1, divWidget ? divWidget.value : 32);

                    // Calculate drawing area
                    const areaX = PADDING.left;
                    const areaY = PADDING.top;
                    const areaW = node.size[0] - PADDING.left - PADDING.right;
                    const areaH = node.size[1] - PADDING.top - PADDING.bottom;

                    if (areaW < 50 || areaH < 50) return;

                    // Perfect square container
                    const boxSize = Math.min(areaW, areaH);
                    const startX = areaX + (areaW - boxSize) / 2;
                    const startY = areaY + (areaH - boxSize) / 2;

                    // Current resolution mapped to box
                    const drawW = Math.max(2, (currentW / MAX_RES) * boxSize);
                    const drawH = Math.max(2, (currentH / MAX_RES) * boxSize);

                    // Draw container background
                    ctx.fillStyle = "#0d0d0d";
                    ctx.fillRect(startX, startY, boxSize, boxSize);
                    
                    // Draw grid
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
                    ctx.lineWidth = 1;
                    ctx.font = "9px monospace";
                    
                    const steps = [512, 1024, 1536, 2048, 2560, 3072, 3584, 4096];
                    
                    steps.forEach(val => {
                        const pos = (val / MAX_RES) * boxSize;
                        
                        // Vertical line
                        ctx.beginPath();
                        ctx.moveTo(startX + pos, startY);
                        ctx.lineTo(startX + pos, startY + boxSize);
                        ctx.stroke();
                        
                        // Horizontal line
                        ctx.beginPath();
                        ctx.moveTo(startX, startY + pos);
                        ctx.lineTo(startX + boxSize, startY + pos);
                        ctx.stroke();
                        
                        // Labels (only show some to avoid clutter)
                        if (val === 512 || val === 1024 || val === 2048 || val === 4096) {
                            ctx.fillStyle = "#666";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "top";
                            ctx.fillText(val, startX + pos, startY + boxSize + 5);
                            
                            ctx.textAlign = "right";
                            ctx.textBaseline = "middle";
                            ctx.fillText(val, startX - 6, startY + pos);
                        }
                    });

                    // Container border
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(startX, startY, boxSize, boxSize);

                    // Draw resolution box
                    ctx.fillStyle = "rgba(0, 255, 150, 0.15)";
                    ctx.fillRect(startX, startY, drawW, drawH);
                    ctx.strokeStyle = "#00ff96";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(startX, startY, drawW, drawH);

                    // Corner handle
                    const handleX = startX + drawW;
                    const handleY = startY + drawH;
                    
                    ctx.fillStyle = "#fff";
                    ctx.beginPath();
                    ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = "#00ff96";
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Resolution text inside box
                    if (drawW > 80 && drawH > 30) {
                        ctx.fillStyle = "#fff";
                        ctx.font = "bold 11px monospace";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(`${currentW}×${currentH}`, startX + drawW / 2, startY + drawH / 2);
                    }

                    // Mouse handlers
                    node.onMouseDown = function (e, local_pos) {
                        const mx = local_pos[0];
                        const my = local_pos[1];
                        const dist = Math.hypot(mx - handleX, my - handleY);
                        if (dist < 12) {
                            isDragging = true;
                            return true; // capture
                        }
                    };

                    node.onMouseMove = function (e, local_pos) {
                        if (!isDragging) return;
                        
                        let newW = ((local_pos[0] - startX) / boxSize) * MAX_RES;
                        let newH = ((local_pos[1] - startY) / boxSize) * MAX_RES;

                        // Clamp
                        newW = Math.max(MIN_RES, Math.min(MAX_RES, newW));
                        newH = Math.max(MIN_RES, Math.min(MAX_RES, newH));

                        // Snap to divisor
                        newW = Math.round(newW / div) * div;
                        newH = Math.round(newH / div) * div;

                        // Ensure minimum after snapping
                        newW = Math.max(div, newW);
                        newH = Math.max(div, newH);

                        wWidget.value = newW;
                        hWidget.value = newH;
                        node.setDirtyCanvas(true, true);
                    };

                    node.onMouseUp = function () {
                        isDragging = false;
                    };
                };
            };
        }
    }
});
