/*=======================================================

    Html Component Library 前端UI框架 V0.1
    常用控件单元
    作者：荆通(18114532@qq.com)
    QQ群：649023932

=======================================================*/

import { hcl } from "./HCL.js";
import { TAlign, TControl, TCursors, TCustomControl, THorizontalAlign, TKey, TMouseButton,
    TMouseEventArgs, TMouseStates, TOrientation, TPopupControl, TPopupWinControl, TScrollBar, TShiftState, TVerticalAlign, TControlState, TControlStyle } from "./Controls.js";
import { TColor, TFont, TFontDetector, TFontStyle, THCCanvas, TPenStyle } from "./Graphics.js";
import { TImeMode } from "./Ime.js";
import { TBytes, TList, TObject, TPoint, TRect, TUtf16Encoding, TFileExt } from "./System.js";

export default class ThisIsHCL { }

export let TImageSrcType = {
    None: 0,
    URL: 1,
    Base64: 2
}

export class TImage extends TControl {
    constructor() {
        super();
        this.autoSize = true;
        this._srcType = TImageSrcType.None;
        this._imageType = "";
        this._onImageLoaded = null;
        this.image = new Image();
        this.image.onload = (e) => {  // eslint-disable-line
            this.doImageLoad_();
        }
    }

    assign(source) {
        this.autoSize = source.autoSize;
        this._srcType = source._srcType;
        this._imageType = source._imageType;
        this.image = new this.image();
        this.image.src = source.image.src;
    }

    static Create(width = 16, height = 16) {
        let vImage = new TImage();
        vImage.width = width;
        vImage.height = height;
        return vImage;
    }

    doImageLoad_() {
        this.loaded = true;
        if (this.autoSize) {
            this.width = this.image.width;
            this.height = this.image.height;
        }
        
        if (this.image.src.indexOf("data:image") > -1) {
            this._srcType = TImageSrcType.Base64;
            let vBase64 = this.image.src;
            let vSection = vBase64.split(",");
            this._imageType = vSection[0].match(/:(.*?);/)[1];  // 文件类型
        } else {
            this._srcType = TImageSrcType.URL;
            let v = this.image.src.lastIndexOf(".");
            this._imageType = this.image.src.substring(v);
        }

        if (this._onImageLoaded != null)
            this._onImageLoaded();

        this.update();
    }

    doPaint_(hclCanvas) {
        if (this.loaded)
            hclCanvas.drawImage(0, 0, this.image);
    }

    doPaintBackground_(hclCanvas) {  // eslint-disable-line
        //super.doPaintBackground_(hclCanvas);
    }

    saveToStream(stream) {
        stream.writeByte(this._srcType);

        let vBytes;
        switch (this._srcType) {
            case TImageSrcType.URL:
                vBytes = TUtf16Encoding.getBytes(this.image.src);
                break;

            case TImageSrcType.Base64: {
                    let vBase64 = this.image.src;
                    let vSection = vBase64.split(",");
                    vBytes = TBytes.fromBase64(vSection[1]);
                }
                break;
            
            default:
                return;
        }

        stream.writeUInt32(vBytes.length);
        stream.writeBuffer(vBytes);
    }

    loadFromStream(stream) {
        this._srcType = stream.readByte();
        if (this._srcType == TImageSrcType.None)
            return;

        let vSize = stream.readUInt32();
        if (vSize > 0) {
            let vBytes = stream.readBuffer(vSize);
            switch (this._srcType) {
                case TImageSrcType.URL:
                    this.image.src = vBytes.toText();
                    break;

                case TImageSrcType.Base64:
                    this.image.src = "data:image/png;base64," + vBytes.toBase64();
                    break;
                
                default:
                    return;
            }
        }
    }

    get src() {
        return this.image.src;
    }

    set src(val) {
        this.image.src = val;
    }

    get srcType() {
        return this._srcType;
    }

    get imageType() {
        return this._imageType;
    }

    get onImageLoaded() {
        return this._onImageLoaded;
    }

    set onImageLoaded(val) {
        this._onImageLoaded = val;
    }
}

export class TSpliter extends TControl {
    constructor() {
        super();
        this.width = 5;
        this.height = 5;
        this.align_ = TAlign.Left;
        this._control = null;
        this._downPos = new TPoint();
    }

    _findControl() {
        let x = this.left, y = this.top;
        switch (this.align_) {
            case TAlign.Left:
                x--;
                break;

            case TAlign.Top:
                y--;
                break;

            case TAlign.Right:
                x = this.right + 1;
                break;

            case TAlign.Bottom:
                y = this.bottom + 1;
                break;
        }

        return this.parent.getControlAt(x, y);
    }

    doMouseDown_(e) {
        if (e.button == TMouseButton.Left) {
            this._downPos.reset(e.x, e.y);
            this._control = this._findControl();
        }

        super.doMouseDown_(e);
    }

    doMouseMove_(e) {
        if (e.button == TMouseButton.Left && this._control != null) {
            switch (this.align_) {
                case TAlign.Left:
                    this._control.width += e.x - this._downPos.x;
                    break;

                case TAlign.Right:
                    this._control.width -= e.x - this._downPos.x;
                    break;

                case TAlign.Top:
                    this._control.height += e.y - this._downPos.y;
                    break;

                case TAlign.Bottom:
                    this._control.height -= e.y - this._downPos.y;
                    break;
            }
        }

        super.doMouseMove_(e);
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        switch (this.align_) {
            case TAlign.Left:
            case TAlign.Right:
                this.cursor = TCursors.HoriSplit;
                break;

            default:
                this.cursor = TCursors.VertSplit;
                break;
        }
    }

    doPaintBackground_(hclCanvas) {
        // hclCanvas.pen.width = 1;
        // hclCanvas.pen.color = theme.borderColor;
        // hclCanvas.beginPath();
        // hclCanvas.drawLine((this.width - hclCanvas.pen.width) / 2, 2,
        //     (this.width - hclCanvas.pen.width) / 2, this.height - 2);
        // hclCanvas.paintPath();
    }
}

export class TTextControl extends TControl {
    constructor(text) {
        super();
        this.text_ = text != null ? text : "";
        this.font = new TFont();
        this.font.onChange = () => { this.doFontChange(); }
        this.borderVisible_ = false;
        this.borderWidth_ = 1;
        this._horiAlign = THorizontalAlign.Left;
        this._vertAlign = TVerticalAlign.Center;
        this._autoWidth = false;
        this._autoHeight = false;
        this.width_ = 75;
        this.height_ = 20;
        this._onChange = null;
    }

    doSetPaddingLeft_(val) {
        if (this.paddingLeft != val) {
            super.doSetPaddingLeft_(val);
            if (this._autoWidth)
                this.doSetAutoWidth_();
        }
    }

    doSetPaddingTop_(val) {
        if (this.paddingTop != val) {
            super.doSetPaddingTop_(val);
            if (this._autoHeight)
                this.doSetAutoHeight_();
        }
    }

    doSetPaddingRight_(val) {
        if (this.paddingRight != val) {
            super.doSetPaddingRight_(val);
            if (this._autoWidth)
                this.doSetAutoWidth_();
        }
    }

    doSetPaddingBottom_(val) {
        if (this.paddingBottom != val) {
            super.doSetPaddingBottom_(val);
            if (this._autoHeight)
                this.doSetAutoHeight_();
        }
    }    

    doCalcWidth_() {
        return this.paddingLeft + this.paddingRight + THCCanvas.textWidth(this.font, this.text);
    }

    doSetAutoWidth_() {
        let vW = this.doCalcWidth_();
        if (this.width != vW)
            this.width = vW;
    }

    doCalcHeight_() {
        return this.paddingTop + this.paddingBottom + this.font.height;
    }

    doSetAutoHeight_() {
        let vH = this.doCalcHeight_();
        if (this.height != vH)
            this.height = vH;
    }

    reCalcSize_() {
        this.beginUpdate()
        try {
            if (this._autoWidth)
                this.doSetAutoWidth_();

            if (this._autoHeight)
                this.doSetAutoHeight_();
        } finally {
            this.endUpdate();
        }
    }

    doFontChange() {
        this.reCalcSize_();
    }

    doChange_() {
        this.reCalcSize_();
        if (this._onChange != null)
            this._onChange();
    }

    doPaintText_(hclCanvas, x, y) {
        /*hclCanvas.font.assign(this.font);  // 有点太频繁了，尤其是Memo
        if (!this.enabled)
            hclCanvas.font.color = hcl.theme.textDisableColor;
        */

        hclCanvas.textOut(x, y, this.text_);
    }

    doPaint_(hclCanvas) {
        if (this.text_.length > 0) {
            hclCanvas.font.assign(this.font);
            if (!this.enabled)
                hclCanvas.font.color = hcl.theme.textDisableColor;

            let vY = 0;
            switch (this._vertAlign) {
                case TVerticalAlign.Bottom:
                    vY = this.height - this.paddingBottom;  // - this.font.height;
                    break;

                case TVerticalAlign.Center:
                    vY = Math.max(0, (this.height - this.font.height) / 2);
                    break;

                default:
                    vY = this.paddingTop;
                    break;
            }

            let vX = 0; let vW = THCCanvas.textWidth(this.font, this.text_);
            switch (this._horiAlign) {
                case THorizontalAlign.Right:
                    vX = this.width - vW - this.paddingRight;
                    break;

                case THorizontalAlign.Center:
                    vX = this.paddingLeft + Math.max(0, (this.width - this.paddingLeft - this.paddingRight - vW) / 2);
                    break;

                default:
                    vX = this.paddingLeft;
                    break;
            }
            
            this.doPaintText_(hclCanvas, vX, vY);
        }
    }

    doSetBorderVisible_() {
        this.update();
    }

    getText_() {
        return this.text_;
    }

    setText_(val) {
        if (this.text_ != val) {
            this.text_ = val.toString();
            this.doSetText_();
        }
    }

    doSetText_() {
        this.doChange_();
    }

    textArea() {
        return TRect.Create(this.paddingLeft + (this.borderVisible_ ? this.borderWidth_ : 0), 
            this.paddingTop + (this.borderVisible_ ? this.borderWidth_ : 0), 
            this.width - (this.borderVisible_ ? this.borderWidth_ : 0) - this.paddingRight,
            this.height - (this.borderVisible_ ? this.borderWidth_ : 0) - this.paddingBottom);
    }

    clear() {
        this.text = "";
    }

    get autoWidth() {
        return this._autoWidth;
    }

    set autoWidth(val) {
        if (this._autoWidth != val) {
            this._autoWidth = val;
            if (val)
                this.doSetAutoWidth_();
        }
    }

    get autoHeight() {
        return this._autoHeight;
    }

    set autoHeight(val) {
        if (this._autoHeight != val) {
            this._autoHeight = val;
            if (val)
                this.doSetAutoHeight_();
        }
    }

    get autoSize() {
        return this._autoWidth && this._autoHeight;
    }

    set autoSize(val) {
        this.autoWidth = val;
        this.autoHeight = val;
    }

    get text() {
        return this.getText_();
    }

    set text(val) {
        this.setText_(val);
    }

    get borderVisible() {
        return this.borderVisible_;
    }

    set borderVisible(val) {
        if (this.borderVisible_ != val) {
            this.borderVisible_ = val;
            this.doSetBorderVisible_();
        }
    }

    get onChange() {
        return this._onChange;
    }

    set onChange(val) {
        this._onChange = val;
    }
}

export class TLable extends TTextControl {
    constructor(text) {
        super(text);
        this._vertAlign = TVerticalAlign.Center;
        this.transparent = true;
        this.autoWidth = true;
        this.autoHeight = true;
    }
}

export class TUrlLable extends TLable {
    constructor(text) {
        super(text);
        this.cursor = TCursors.HandPoint;
        this.url = "";
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        this.update();
    }

    doMouseLeave_() {
        super.doMouseLeave_();
        this.update();
    }

    doPaintText_(hclCanvas, x, y) {
        if (this.mouseIn) {
            hclCanvas.font.assign(this.font);
            hclCanvas.font.color = TColor.Blue;
            hclCanvas.font.styles.add(TFontStyle.Underline);
            hclCanvas.textOut(x, y, this.text_);
        } else
            super.doPaintText_(hclCanvas, x, y);
    }

    doClick_() {
        if (this.url != "")
            hcl.system.openURL(this.url);

        super.doClick_();
    }
}

export class TButton extends TTextControl {
    constructor(text) {
        super(text);
        this._horiAlign = THorizontalAlign.Center;
        this._vertAlign = TVerticalAlign.Center;
        this._paddingLeft = 5;
        this._paddingTop = 5;
        this._paddingRight = 5;
        this._paddingBottom = 5;
        this.textVisible_ = true;  
        this.canFocus = true;
        this.width = 75;
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        this.update();
    }

    doMouseLeave_() {
        super.doMouseLeave_();
        this.update();
    }

    doMouseDown_(e) {
        super.doMouseDown_(e);
        this.update();
    }

    doMouseUp_(e) {
        super.doMouseUp_(e);
        this.update();
    }

    doSetAutoWidth_() {
        if (this.textVisible_)
            super.doSetAutoWidth_();
        else
            this.width = this.paddingLeft + this.paddingRight;

        if (this.width < hcl.theme.iconWidth)
            this.width = hcl.theme.iconWidth;
    }

    doPaintStaticBackground_(hclCanvas) {
        hclCanvas.brush.color = hcl.theme.backgroundLightColor;
        hclCanvas.fillBounds(0, 0, this.width, this.height);
    }

    doPaintHotBackground_(hclCanvas) {
        if (this.mouseStates.has(TMouseStates.MouseDown))
            hclCanvas.brush.color = hcl.theme.backgroundDownColor;
        else
            hclCanvas.brush.color = hcl.theme.backgroundHotColor;

        hclCanvas.fillBounds(0, 0, this.width, this.height);
    }

    doPaintBackground_(hclCanvas) {
        if (this.mouseStates.has(TMouseStates.MouseIn)) 
            this.doPaintHotBackground_(hclCanvas);
        else
            this.doPaintStaticBackground_(hclCanvas);

        super.doPaintBackground_(hclCanvas);
    }

    doPaint_(hclCanvas) {
        if (this.textVisible_)
            super.doPaint_(hclCanvas);
    }

    setTextVisible_(val) {
        if (this.textVisible_ != val)
            this.textVisible_ = val;
    }

    get textVisible() {
        return this.textVisible_;
    }

    set textVisible(val) {
        this.setTextVisible_(val);
        this.doSetAutoWidth_();
    }
}

export class TImageButton extends TButton {
    constructor(text) {
        super(text);
        this.image = TImage.Create(16, 16);
        this.image.left = 2;
        this.image.onImageLoaded = () => { this.doImageLoaded_(); }
    }

    doImageLoaded_() {
        this.paddingLeft = hcl.theme.iconWidth;
        this.doSetAutoWidth_();
        this.updateRect(this.image.bounds());
    }

    doPaintStaticBackground_(hclCanvas) { }

    doPaint_(hclCanvas) {
        if (this.image.src != "") {
            this.image.top = Math.trunc((this.height - this.image.height) / 2);  // 小数容易不清楚
            this.image.paintTo(hclCanvas, this.image.left, this.image.top);
            hclCanvas.save();
            try {
                //hclCanvas.translate(this.image.left + this.image.width + 2, 0);
                super.doPaint_(hclCanvas);
            } finally {
                hclCanvas.restore();
            }
        }
        else
            super.doPaint_(hclCanvas);
    }

    setTextVisible_(val) {
        if (this.textVisible_ != val) {
            this.textVisible_ = val;
            if (val)
                this._paddingRight = 5;
            else
                this._paddingRight = 0;
        }
    }
}

export class TMenuButton extends TImageButton {
    constructor(text) {
        super(text);
        this.dropDownMenu = null;
        this._paddingRight = hcl.theme.dropDownButtonSize;
    }

    doClick_() {
        if (this.dropDownMenu != null) {
            this.dropDownMenu.dropDownStyle = true;
            this.dropDownMenu.popupControl(this)
        }

        super.doClick_();
    }

    doPaintBackground_(hclCanvas) {
        super.doPaintBackground_(hclCanvas);
        hcl.theme.drawDropDown(hclCanvas, TRect.CreateByBounds(this.width - hcl.theme.dropDownButtonSize,
            0, hcl.theme.dropDownButtonSize, this.height));
    }

    setTextVisible_(val) {
        if (this.textVisible_ != val) {
            this.textVisible_ = val;
            if (val)
                this._paddingRight = hcl.theme.dropDownButtonSize;
            else
                this._paddingRight = 0;
        }
    }
}

export class TToolButton extends TImageButton {
    constructor(text) {
        super(text);

        this.canFocus = false;
        this._checked = false;
        this.textVisible_ = false;
        this._paddingRight = 0;
        this.align = TAlign.Left;
        this.autoWidth = true;
    }

    doPaintBackground_(hclCanvas) {
        if (this._checked) {
            hclCanvas.brush.color = hcl.theme.backgroundDownColor;
            hclCanvas.fillBounds(0, 0, this.width, this.height);
        } else
            super.doPaintBackground_(hclCanvas);
    }

    get checked() {
        return this._checked;
    }

    set checked(val) {
        if (this._checked != val) {
            this._checked = val;
            this.update();
        }
    }    
}

export class TToolMenuButton extends TMenuButton {
    constructor(text) {
        super(text);

        this.canFocus = false;
        this._checked = false;
        this.textVisible_ = false;
        this.align = TAlign.Left;
        this.autoWidth = true;
    }
}

export class TToolBarSpliter extends TControl {
    constructor() {
        super();
        this.width = 3;
        this.align = TAlign.Left;
    }

    doPaintBackground_(hclCanvas) {
        hclCanvas.pen.width = 1;
        hclCanvas.pen.color = hcl.theme.borderColor;
        hclCanvas.beginPath();
        hclCanvas.drawLine((this.width - hclCanvas.pen.width) / 2, 2,
            (this.width - hclCanvas.pen.width) / 2, this.height - 2);
        hclCanvas.paintPath();
    }
}

export class TPanel extends TCustomControl {
    constructor() {
        super();
        this.width_ = 200;
        this.height_ = 200;
        this.borderVisible_ = true;
    }

    doPaintBorder_(hclCanvas) {
        if (this.borderVisible_) {
            hclCanvas.pen.color = hcl.theme.borderColor;
            hclCanvas.pen.width = hcl.theme.borderWidth;
            hclCanvas.rectangleBounds(0, 0, this.width, this.height);
        }
    }

    doPaint_(hclCanvas) {
        super.doPaint_(hclCanvas);
        this.doPaintBorder_(hclCanvas);
    }

    get borderVisible() {
        return this.borderVisible_;
    }

    set borderVisible(val) {
        if (this.borderVisible_ != val) {
            this.borderVisible_ = val;
            this.update();
        }
    }
 }

export class TToolBar extends TCustomControl {
    constructor() {
        super();
        this.height = 22;
    }

    doAlign_() {
        let vLeft = this.paddingLeft;
        let vRight = this.width - this.paddingRight;
        let vControl = null;

        for (let i = 0; i < this.controls.count; i++) {
            vControl = this.controls[i];
            if (!vControl.visible)
                continue;
                
            if (vControl.align == TAlign.Left) {  // 左对齐
                vControl.left = vLeft + vControl.marginLeft;
                vControl.top = this.paddingTop + vControl.marginTop;
                vControl.height = this.height - this.paddingTop - this.paddingBottom
                    - vControl.marginTop - vControl.marginBottom;
                vLeft = vControl.left + vControl.width + vControl.marginRight;
            }
            else {  // 非左即右
                vRight = vRight - vControl.marginRight - vControl.width;
                vControl.left = vRight;
                vControl.top = this.paddingTop + vControl.marginTop;
                vControl.height = this.height - this.paddingTop - this.paddingBottom
                    - vControl.marginTop - vControl.marginBottom;
                vRight = vRight - vControl.marginLeft;
            }
        }

        this.update();
    }

    addButton(text, textVisible = true, img = "") {
        let vButton = new TToolButton(text);
        vButton.textVisible = textVisible;

        if (img != "")
            vButton.image.src = img;

        this.addControl(vButton);
        return vButton;
    }

    addSpliter() {
        let vSpliter = new TToolBarSpliter();
        this.addControl(vSpliter);
    }
}

export class TCaptionBar extends TToolBar {
    constructor() {
        super();
        this._x = 0;
        this._y = 0;
        this.captureParent = true;
    }

    doMouseDown_(e) {
        super.doMouseDown_(e);

        this._x = e.x;
        this._y = e.y;

        if ((e.button == TMouseButton.Left && this.captureParent && this.getControlAt(e.x, e.y, false) === null)) {
            hcl.application.setCapture(this);
            this.captured = true;
        }
        else
            this.captured = false;
    }

    doMouseMove_(e) {
        super.doMouseMove_(e);
        if (this.captured && this.captureParent) {
            let vControl = this.parent;
            let vOldRect = this.parent.bounds();
            let vRect = vOldRect.offset(e.x - this._x, e.y - this._y, true);
            vRect = vRect.union(vOldRect);
            vRect.offset(-1, -1);
            vControl.left += e.x - this._x;
            vControl.top += e.y - this._y;
            hcl.application.updateRect(vRect); 

            // while (control != null) {
            //     if (control instanceof TForm) {
            //         let point = control.clientToScreen(TPoint.Create(0, 0));
            //         let oldRect = TRect.CreateByBounds(point.x, point.y, control.width, control.height);
            //         let rect = oldRect.offset(e.x - this._x, e.y - this._y, true);
            //         rect = rect.union(oldRect);
            //         rect.offset(-1, -1);
            //         control.left += e.x - this._x;
            //         control.top += e.y - this._y;
            //         hcl.application.updateRect(rect);
            //         break;
            //     }
            //     else
            //         control = control.parent;
            // }
        }
    }

    doMouseUp_(e) {
        super.doMouseUp_(e);
        if (this.captured) {
            hcl.application.releaseCapture();
            this.captured = false;
        }
    }
}

export class TCheckBox extends TLable {
    constructor(text) {
        super(text);
        this._checked = false;
        this._downInCheck = false;
        this._checkByText = true;
        this.paddingLeft = 2 + hcl.theme.iconSize;
        this.onSwitch = null;
    }

    _getBoxRect() {
        return TRect.CreateByBounds(2, Math.trunc((this.height - hcl.theme.iconSize) / 2) + 1, hcl.theme.iconSize - 2, hcl.theme.iconSize - 2);
    }

    doCalcWidth_() {
        return super.doCalcWidth_();
    }

    doSetBounds_() {
        if (this.height_ < hcl.theme.iconSize)
            this.height_ = hcl.theme.iconSize;

        super.doSetBounds_();
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        this.updateRect(this._getBoxRect());
    }

    doMouseLeave_() {
        super.doMouseLeave_();
        this.updateRect(this._getBoxRect());
    }

    doMouseDown_(e) {
        let vRect = this._getBoxRect();
        if (e.y < vRect.top || e.y > vRect.bottom)
            return

        if (this._checkByText)
            this._downInCheck = true;
        else
            this._downInCheck = vRect.pointInAt(e.x, e.y);

        super.doMouseDown_(e);
    }

    doMouseUp_(e) {
        let vRect = this._getBoxRect();
        if (e.y < vRect.top || e.y > vRect.bottom)
            return

        if (this._downInCheck) {
            if (!this._checkByText && !vRect.pointInAt(e.x, e.y)) {
                //;
            } else {
                this.checked = !this._checked;
                if (this.onSwitch != null)
                    this.onSwitch();
            }
        }
        
        super.doMouseUp_(e);
    }

    doPaint_(hclCanvas) {
        if (this.mouseIn)
            hclCanvas.pen.color = hcl.theme.borderHotColor;
        else
            hclCanvas.pen.color = hcl.theme.borderColor;

        let vBoxRect = this._getBoxRect();
        if (this._checked)
            hcl.theme.drawFrameControl(hclCanvas, vBoxRect, new Set([TControlState.Checked]), TControlStyle.CheckBox);
        else
            hcl.theme.drawFrameControl(hclCanvas, vBoxRect, new Set([]), TControlStyle.CheckBox);

        super.doPaint_(hclCanvas);
    }

    get checked() {
        return this._checked;
    }

    set checked(val) {
        if (this._checked != val) {
            this._checked = val;
            this.updateRect(this._getBoxRect());
        }
    }
}

export class TInputControl extends TTextControl {
    constructor(text) {
        super(text);        
        this._readOnly = false;
        this.cursor_ = TCursors.Ibeam;
        this.imeMode = TImeMode.Disabled;
        this.popupMenuEnable = true;
        this.popupMenu = new TPopupMenu();
        this._copyMenuItem = this.popupMenu.addItem("复制");
        this._copyMenuItem.onClick = () => {
            this.doCopy_();
        }

        this._copyToBrowerMenuItem = this.popupMenu.addItem("复制到浏览器");
        this._copyToBrowerMenuItem.onClick = () => {
            this.doCopyToBrower_();
        }

        this._cutMenuItem = this.popupMenu.addItem("剪切");
        this._cutMenuItem.onClick = () => {
            this.doCut_();
        }

        this._pasteMenuItem = this.popupMenu.addItem("粘贴");
        this._pasteMenuItem.onClick = () => {
            this.doPaste_();
        }

        this.popupMenu.addSpliter();
        let vItem = this.popupMenu.addItem("删除");
        vItem.addItem("全部删除");
        let vItem2 = vItem.addItem("增量删除");
        vItem2.addItem("1111111");
        vItem2.addItem("2222222");
        vItem2.addItem("3333333");
        vItem2 = vItem.addItem("删除选中");
        vItem2.addItem("aaaa");
        vItem2.addItem("bbbb");
        vItem2.addItem("cccc");
    }

    removed_() {
        super.removed_();
        hcl.ime.removeControl(this);
    }

    doContextMenu_(x, y) {
        if (!this.popupMenuEnable)
            return;

        this._copyMenuItem.enabled = this.canCopy_();
        this._cutMenuItem.enabled = this.canCut_();
        this._pasteMenuItem.enabled = this.canPaste_();
        super.doContextMenu_(x, y);
    }

    doCheckImeMode_() {
        if (!this._readOnly) {
            if (this.imeMode != TImeMode.Disabled)
                hcl.ime.setControl(this);  // 保证显示光标时ime的Control是我
        }
    }

    doMouseDown_(e) {
        super.doMouseDown_(e);
        this.doCheckImeMode_();
    }

    doMouseUp_(e) {
        if (!this._readOnly && this.mouseStates.has(TMouseStates.MouseDown)) {
            if (this.imeMode != TImeMode.Disabled)
                hcl.ime.setControl(this);  // 保证ime在鼠标弹起时有机会激活(浏览器在鼠标弹起时才激活)
        }

        super.doMouseUp_(e);
    }

    doSetReadOnly_() { }

    doCopy_() { }

    doCopyToBrower_() { }

    doCut_() { }

    doPaste_() { }

    canCopy_() {
        return false;
    }

    canCut_() {
        return false;
    }

    canPaste_() {
        return false;
    }

    imeActive() { } // 输入法激活后通知事件

    insertText(index, text) {
        this.text = this.text.insert(index, text);
    }

    deleteText(index, length) {
        this.text = this.text.delete(index, length);
    }

    imePaste() { }

    imeInput(text) { }  // eslint-disable-line

    get readOnly() {
        return this._readOnly;
    }

    set readOnly(val) {
        if (this._readOnly != val) {
            this._readOnly = val;
            this.doSetReadOnly_();
        }
    }
}

export class TEdit extends TInputControl {
    constructor(text) {
        super(text);
        this.canFocus = true;
        this.borderVisible_ = true;
        this._vertAlign = TVerticalAlign.Center;
        this._selStart = -1;
        this._selEnd = -1;
        this._selMove = -1;
        this._leftOffset = 0;
        this._marginLeft = 2;
        this._marginTop = 2;
        this._marginRight = 2;
        this._marginBottom = 2;
        this._paddingLeft = 2;
        this._paddingTop = 2;
        this._paddingRight = 2;
        this._paddingBottom = 2;
        this._textPrompt = "";  // 提示信息
        this.imeMode = TImeMode.Active;
    }

    _selectActionLeft() {
        if (this.selectExists()) {
            if (this._selMove == this._selStart && this._selStart > 0) {
                this._selStart--;
                this._selMove = this._selStart;
            } else if (this._selMove == this._selEnd && this._selEnd <= this.text.length) {
                this._selEnd--;
                if (this._selEnd == this._selStart) {
                    this._selEnd = -1;
                    this._selMove = this._selStart;
                } else
                    this._selMove = this._selEnd;
            }

            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        } else if (this._selStart > 0) {
            this._selEnd = this._selStart;
            this._selStart--;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        }
    }

    _selectActionRight() {
        if (this.selectExists()) {
            if (this._selMove == this._selStart && this._selStart < this.text.length) {
                this._selStart++;
                if (this._selStart == this._selEnd)
                    this._selEnd = -1;
                
                this._selMove = this._selStart;
            } else if (this._selMove == this._selEnd && this._selEnd < this.text.length) {
                this._selEnd++;
                this._selMove = this._selEnd;
            }

            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        } else if (this._selStart < this.text.length) {
            this._selEnd = this._selStart + 1;
            this._selMove = this._selEnd;
            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        }
    }

    _createCaret() {
        hcl.application.createCaret(this, null, 0, this.font.height + 1);
    }

    _destroyCaret() {
        hcl.application.destroyCaret(this);
    }

    getCharOffsetAt_(x, y) {  // eslint-disable-line
        let vX = x - (this.borderVisible_ ? this.borderWidth_ : 0) - this.paddingLeft + this._leftOffset;

        if (this.text.length > 0) {
            let vArr = THCCanvas.getTextExtent(this.font, this.text);
            let vLeft = 0;
            for (let i = 0; i < vArr.length; i++) {
                vLeft += vArr[i];
                if (vLeft >= vX) {
                    if (Math.trunc(vLeft - vArr[i] / 2) > vX)
                        return i;
                    else
                        return i + 1;
                }
            }

            if (vX > vLeft)
                return this.text.length;
        }
            
        return 0;
    }

    getCharLeft_(offset) {
        let vResult = 0;
        if (offset > 0) {
            let vArr = THCCanvas.getTextExtent(this.font, this.text, offset);
            for (let i = 0; i < offset; i++)
                vResult += vArr[i];
        }

        return vResult + (this.borderVisible_ ? this.borderWidth_ : 0) + this.paddingLeft - this._leftOffset;
    }

    getCharTop_() {
        switch (this._vertAlign) {
            case TVerticalAlign.Bottom:
                return this.height - this.paddingBottom - (this.borderVisible_ ? this.borderWidth_ : 0);

            case TVerticalAlign.Center:
                return this.paddingTop + (this.borderVisible_ ? this.borderWidth_ : 0)
                    + Math.max(0, (this.height - this.paddingTop - this.paddingBottom
                        - (this.borderVisible_ ? this.borderWidth_ + this.borderWidth_ : 0) - this.font.height) / 2);

            default:
                return this.paddingTop + (this.borderVisible_ ? this.borderWidth_ : 0);
        }
    }

    resetSelect_() {
        if (this.selectExists())
            this.hideCaret_();
        else if (this._selStart >= 0)
            this.showCaret_();

        this.update();
    }
    
    scrollAdjust_(index) {
        let vRect = this.textArea();
        let vW = THCCanvas.textWidth(this.font, this.text);
        if (vW < vRect.width) {
            this._leftOffset = 0;
            return;
        }

        if (vW - this._leftOffset < vRect.width) {
            this._leftOffset = vW - vRect.width;
            return;
        }
        
        let vText = this.text.substring(0, index);
        let vRight = THCCanvas.textWidth(this.font, vText) + vRect.left - this._leftOffset;

        if (vRight > vRect.right)
            this._leftOffset += vRight - vRect.right;
        else if (vRight < vRect.left)
            this._leftOffset -= vRect.left - vRight;
    }

    doPaintBorder_(hclCanvas, rect) {
        hclCanvas.pen.width = this.borderWidth_;
        hclCanvas.pen.style = TPenStyle.Solid;
        if (this._readOnly)
            hclCanvas.pen.color = hcl.theme.borderColor;
        else if (this.focused)
            hclCanvas.pen.color = hcl.theme.borderActiveColor;
        else if (this.mouseIn)
            hclCanvas.pen.color = hcl.theme.borderHotColor;
        else
            hclCanvas.pen.color = hcl.theme.borderColor;
            
        hclCanvas.rectangleRect(rect);
    }

    doPaintSelected_(hclCanvas) {
        hclCanvas.brush.color = hcl.theme.backgroundSelectColor;
        let vLeft = this.getCharLeft_(this._selStart);
        let vRight = this.getCharLeft_(this._selEnd);
        let vRect = this.textArea();
        vLeft = Math.max(vRect.left, Math.min(vLeft, vRect.right));
        vRight = Math.max(vRect.left, Math.min(vRight, vRect.right));
        hclCanvas.fillBounds(vLeft, vRect.top, vRight - vLeft, vRect.height);
    }

    showCaret_() {
        if (this._selStart < 0)
            return;

        let vX = this.getCharLeft_(this._selStart) - 1;
        hcl.ime.updatePosition(vX, 0);
        hcl.application.setCaretPos(vX, this.getCharTop_() - 1);
        hcl.application.showCaret(this);
    }

    hideCaret_() {
        hcl.application.hideCaret(this);
    }

    doCopy_() {
        this.copy();
    }

    doCopyToBrower_() {
        this.copyToBrower();
    }

    doCut_() {
        this.cut();
    }

    doPaste_() {
        this.paste();
    }

    canCopy_() {
        return this.selectExists();
    }

    canCut_() {
        return !this.readOnly && this.selectExists();
    }

    canPaste_() {
        return !this.readOnly;
    }

    doSetBounds_() {
        super.doSetBounds_();
        this.showCaret_();
    }

    doBackKeyDown_() {
        this.beginUpdate();
        try {
            if (this.selectExists())
                this.deleteSelect();
            else if (this._selStart > 0) {
                this._selStart--;
                this.deleteText(this._selStart, 1);
                this._selMove = this._selStart;
                this.scrollAdjust_(this._selMove);
                this.showCaret_();
            }
        } finally {
            this.endUpdate();
        }
    }

    doDeleteKeyDown_() {
        this.beginUpdate();
        try {
            if (this.selectExists())
                this.deleteSelect();
            else 
            if (this._selStart < this.text.length) {
                this.deleteText(this._selStart, 1);
                this.showCaret_();
            }
        } finally {
            this.endUpdate();
        }
    }

    doLeftKeyDown_() {
        this.beginUpdate();
        try {
            if (!this.selectExists() && this._selStart > 0)
                this._selStart--;

            this._selEnd = -1;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        } finally {
            this.endUpdate();
        }
    }

    doRightKeyDown_() {
        this.beginUpdate();
        try {
            if (!this.selectExists() && this._selStart < this.text.length)
                this._selStart++;
            
            this._selEnd = -1;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        } finally {
            this.endUpdate();
        }
    }

    doHomeKeyDown_() {
        this.beginUpdate();
        try {
            this._selEnd = -1;
            this._selStart = 0;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        } finally {
            this.endUpdate();
        }
    }

    doEndKeyDown_() {
        this.beginUpdate();
        try {
            this._selEnd = -1;
            this._selStart = this.text.length;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        } finally {
            this.endUpdate();
        }
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        if (!this._readOnly)
            this.update();
    }

    doMouseLeave_() {
        super.doMouseLeave_();
        if (!this._readOnly)
            this.update();
    }

    doMouseDown_(e) {
        super.doMouseDown_(e);
        if (e.button == TMouseButton.Left) {
            this.disSelect();
            //this._selEnd = -1;
            if (e.x > 0 && e.x < this.width - (this.borderVisible_ ? this.borderWidth_ : 0) - this.paddingRight) {
                this._selStart = this.getCharOffsetAt_(e.x, e.y);
                this._selMove = this._selStart;
                this.scrollAdjust_(this._selMove);
                this.resetSelect_();
            }
        } else if (this._selStart < 0) {
            this._selStart = this.getCharOffsetAt_(e.x, e.y);
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        }
    }

    doMouseMove_(e) {
        let vTextRect = this.textArea();
        if (e.button === TMouseButton.Left) {  // left button down
            if (e.x < 0)
                this._leftOffset = Math.max(0, this._leftOffset - this.font.advCharWidth);
            else if (e.x > 0) {
                let vW = THCCanvas.textWidth(this.font, this.text_);
                if (e.x > vTextRect.right)
                    this._leftOffset = Math.max(0, Math.min(vW - vTextRect.width, this._leftOffset + this.font.advCharWidth));
            }
            
            this._selEnd = this.getCharOffsetAt_(e.x, e.y);
            this._selMove = this._selEnd;
            if (!this.selectExists()) {
                if (this._selEnd >= 0) {
                    this._selEnd = -1;
                    this._selMove = this._selStart;
                }
            }

            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
        }

        if (vTextRect.pointInAt(e.x, e.y))
            this.cursor = TCursors.Ibeam;
        else
            this.cursor = TCursors.Default;

        super.doMouseMove_(e);
    }

    doMouseUp_(e) {
        if (e.button == TMouseButton.Left && this._selEnd >= 0 && this._selEnd < this._selStart) {
            let vSel = this._selStart;
            this._selStart = this._selEnd;
            this._selEnd = vSel;
        }

        super.doMouseUp_(e);
    }

    doKeyDown_(e) {
        if (this.readOnly)
            return;

        switch (e.keyCode) {
            case TKey.Back:
                this.doBackKeyDown_();
                break;

            case TKey.Delete:
                this.doDeleteKeyDown_();
                break;

            case TKey.Left:
                if (e.shiftState.compare(new Set([TShiftState.Shift])))
                    this._selectActionLeft();
                else
                    this.doLeftKeyDown_();

                break;

            case TKey.Right:
                if (e.shiftState.compare(new Set([TShiftState.Shift])))
                    this._selectActionRight();
                else
                    this.doRightKeyDown_();

                break;

            case TKey.Home:
                this.doHomeKeyDown_();
                break;

            case TKey.End:
                this.doEndKeyDown_();
                break;

            case TKey.A:
                if (e.shiftState.compare(new Set([TShiftState.Ctrl])))
                    this.selectAll();
                
                break;

            case TKey.C:
                if (e.shiftState.compare(new Set([TShiftState.Ctrl])))
                    this.copy();
                
                break;
    
            case TKey.V:
                if (e.shiftState.compare(new Set([TShiftState.Ctrl])))
                    this.paste();

                break;

            case TKey.X:
                if (e.shiftState.compare(new Set([TShiftState.Ctrl]))) 
                    this.cut();
            
                break;

            default:
                super.doKeyDown_(e);
                break;
        }
    }

    doKeyPress_(e) {
        this.insertText(this._selStart, e.key);
        super.doKeyPress_(e);
    }

    doSetFocus_(accept) {
        super.doSetFocus_(accept);
        if (accept) {
            this._createCaret();
            // 保证调用setFocus方法时，也能有光标显示
            this._selStart = 0;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
            this.doCheckImeMode_();
        }
    }

    doKillFocus_() {
        this.disSelect();
        this._selStart = -1;
        this._selMove = -1;
        this._leftOffset = 0;
        super.doKillFocus_();
    }

    doDblClick_(e) {
        this.selectAll();
        super.doDblClick_(e);
    }

    doPaintBackground_(hclCanvas) {
        let vRect = this.clientRect();
        // background
        vRect.left = this.paddingLeft;
        hclCanvas.brush.color = hcl.theme.backgroundContentColor;
        hclCanvas.fillRect(vRect);

        // selected background
        if (this.selectExists()) 
            this.doPaintSelected_(hclCanvas);

        // border
        if (this.borderVisible_) {
            vRect.left -= this.borderWidth_;
            this.doPaintBorder_(hclCanvas, vRect);
        }

        vRect = this.textArea();
        // more hint
        if (this._leftOffset > 0) {
            hclCanvas.brush.color = this.font.color;
            hclCanvas.fillBounds(vRect.left - 1, vRect.top + 1, 1, vRect.height - 2);
        }

        let vW = THCCanvas.textWidth(this.font, this.text_);
        if (vW > this._leftOffset + vRect.width) {
            hclCanvas.brush.color = this.font.color;
            hclCanvas.fillBounds(vRect.right + 1, vRect.top + 1, 1, vRect.height - 2);
        }
    }

    doPaintText_(hclCanvas, x, y) {
        if (this.text_ != "")
            hclCanvas.textOut(x - this._leftOffset, y, this.text_);
    }

    doPaint_(hclCanvas) {
        hclCanvas.save();
        try {
            let vRect = this.textArea();
            hclCanvas.clipRect(vRect);
            if (this.text != "")
                super.doPaint_(hclCanvas);
            else if (this._textPrompt != "") {  // !this.focused &&
                hclCanvas.font.styles.value = TFontStyle.Italic;
                hclCanvas.font.color = TColor.Gray;
                hclCanvas.textOut(this.getCharLeft_(0), this.getCharTop_(), this._textPrompt);
            }
        } finally {
            hclCanvas.restore();
        }
    }

    doSetText_() {
        this.disSelect();
        if (this._selStart > this.text.length)
            this._selStart = this.text.length;

        super.doSetText_();
    }

    doInsertText(index, text) {
        super.insertText(index, text);
        if (this._selStart >= 0) {
            this._selStart += text.length;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        }
    }

    dispose() {
        this._destroyCaret();        
    }

    insertText(index, text) {
        this.beginUpdate();
        try {
            if (this.selectExists())
                this.deleteSelect();

            this.doInsertText(index, text);
        } finally {
            this.endUpdate();
        }
    }

    copy() {
        hcl.clipboard.clear();
        if (this.selectExists())
            hcl.clipboard.setText(this.selectText());
    }

    copyToBrower() {
        if (this.selectExists())
            hcl.clipboard.toBrowerClipboard(this.selectText());
    }

    cut() {
        this.copy();
        this.deleteSelect();
    }

    paste() {
        let vText = hcl.localStorage.getString(TFileExt.Text);  //hcl.clipboard.getText();
        if (vText != null) 
            this.insertText(this._selStart, vText);
    }

    deleteSelect() {
        this.beginUpdate();
        try {
            this.deleteText(this._selStart, this.selLength);
            this._selEnd = -1;
            this._selMove = this._selStart;
            this.scrollAdjust_(this._selMove);
            this.showCaret_();
        } finally {
            this.endUpdate();
        }
    }

    disSelect() {
        this._selMove = this._selStart;
        if (this.selectExists()) {
            this._selEnd = -1;
            this.resetSelect_();
        } 
    }

    select(start, length = 0) {
        if (start < 0)
            return;

        this._selStart = start;
        if (length >= 0) {
            this._selEnd = start + length;
            this._selMove = this._selEnd;
        } else {
            this._selEnd = -1;
            this._selMove = this._selStart;
        }

        this.scrollAdjust_(this._selMove);
        this.resetSelect_();
    }

    selectAll() {
        this.select(0, this.text.length);
    }

    selectText() {
        if (this._selEnd >= 0)
            return this.text.substring(this._selStart, this._selEnd);

        return "";
    }

    selectExists() {
        if ((this._selEnd >= 0) && (this._selEnd != this._selStart))
            return true;
        
        return false;
    }

    imeInput(text) {
        if (!this.readOnly)
            this.insertText(this._selStart, text);
    }

    get selStart() {
        if (this.selectExists() && (this._selEnd < this._selStart))
            return this._selEnd;

        return this._selStart;
    }

    get selLength() {
        if (this._selEnd < 0) 
            return 0;

        return Math.abs(this._selEnd - this._selStart);
    }

    get textPrompt() {
        return this._textPrompt;
    }

    set textPrompt(val) {
        if (this._textPrompt != val) {
            this._textPrompt = val;
            this.update();
        }
    }

    get number() {
        return parseInt(this.text);
    }
}

class TMemoLine extends TObject {
    constructor(text) {
        super();
        this.text = text;
        this.firstDrawNo = -1;
    }
}

class TLineDraw extends TObject {
    constructor() {
        super();
        this.lineNo = -1;
        this.offset = -1;
        this.length = 0;
        this.rect = new TRect();
    }
}

class TMemoSelInfo {
    constructor() {
        this.init();
    }

    assign(src) {
        this.drawNo = src.drawNo;
        this.offset = src.offset;
    }

    init() {
        this.drawNo = -1;
        this.offset = -1;
    }
}

export class TMemo extends TInputControl {
    constructor(text = "") {
        super("");
        this.canFocus = true;
        this.borderVisible_ = true;
        this.width_ = 160;
        this.height_ = 80;
        this._marginLeft = 2;
        this._marginTop = 2;
        this._marginRight = 2;
        this._marginBottom = 2;
        this._paddingLeft = 2;
        this._paddingTop = 2;
        this._paddingRight = 2;
        this._paddingBottom = 2;
        this._lineSpace = hcl.theme.marginSpace;
        this._firstDraw = -1;
        this._lastDraw = -1;
        this._selStart = new TMemoSelInfo();
        this._selEnd = new TMemoSelInfo();
        this._selMove = new TMemoSelInfo();

        this.canFocus = true;
        this.imeMode = TImeMode.Active;
        this.hscrollBar = new TScrollBar();
        this.hscrollBar.onShow = () => { this._scrollBarVisibleChange(); }
        this.hscrollBar.onHide = () => { this._scrollBarVisibleChange(); }
        this.hscrollBar.onScroll = (scrollCode, position) => { this.update(); }

        this.vscrollBar = new TScrollBar();
        this.vscrollBar.orientation = TOrientation.Vertical;
        this.vscrollBar.onShow = () => { this._scrollBarVisibleChange(); }
        this.vscrollBar.onHide = () => { this._scrollBarVisibleChange(); }
        this.vscrollBar.onScroll = (scrollCode, position) => { this.update(); }

        this._drawItems = new TList();
        this.lines = new TList();
        this.lines.onAdded = (item) => { this._reSetContent(); }

        this.lines.onRemoved = (item) => {  // eslint-disable-line
            this._itemIndex = -1;
            this._hotIndex = -1;
            this._reSetContent();
        }

        this.text = text;
    }

    _scrollBarVisibleChange() {
        this.doFormat();
        this._reSetContent();
        this.update();
    }

    _getDrawText(i) {
        let vDraw = this._drawItems[i];
        return this.lines[vDraw.lineNo].text.substr(vDraw.offset - 1, vDraw.length);
    }

    _getDisplayDraws() {
        this._firstDraw = -1;
        this._lastDraw = -1;
        for (let i = 0; i < this._drawItems.count; i++) {
            if (this._drawItems[i].rect.bottom - this.vscrollBar.position > this._paddingTop) {
                this._firstDraw = i;
                break;
            }
        }

        if (this._firstDraw >= 0) {
            for (let i = this._drawItems.count - 1; i >= this._firstDraw; i--) {
                if (this._drawItems[i].rect.top - this.vscrollBar.position < this.height_ - this._paddingBottom) {
                    this._lastDraw = i;
                    break;
                }
            }
        }
    }

    getText_() {
        let vS = this.lines[0];
        for (let i = 1; i < this.lines.count; i ++)
            vS += hcl.system.lineBreak + this.lines[i];

        return vS;
    }

    setText_(val) {
        this.clear();
        let vArr = val.split(hcl.system.lineBreak), vLine;
        for (let i = 0; i < vArr.length; i++) {
            vLine = new TMemoLine(vArr[i]);
            this.lines.add(vLine);
        }

        this.doFormat();
    }

    textArea() {
        let vRect = super.textArea();
        if (this.hscrollBar.visible)
            vRect.bottom -= this.hscrollBar.height;

        if (this.vscrollBar.visible)
            vRect.right -= this.vscrollBar.width;

        return vRect;
    }

    clear() {
        this._firstDraw = -1;
        this._lastDraw = -1;
        this._drawItems.clear();
        this.lines.clear();
        this.hscrollBar.position = 0;
        this.vscrollBar.position = 0;
    }

    _newDraw(lineNo, offset, length, rect) {
        let vDraw = new TLineDraw();
        vDraw.lineNo = lineNo;
        vDraw.offset = offset;
        vDraw.length = length;
        vDraw.rect.resetRect(rect);
        this._drawItems.add(vDraw);
        if (offset == 1)
            this.lines[lineNo].firstDrawNo = this._drawItems.count - 1;
    }

    doFormat() {
        this._drawItems.clear();
        let vLine, vS, vLen, vCharWArr,
            vRect = this.textArea(),
            vW = vRect.width;

        let vTop = this._paddingTop
        if (this.borderVisible_)
            vTop += this.borderWidth_;

        if (this.hscrollBar.visible) {
            for (let i = 0; i < this.lines.count; i++) {
                vLine = this.lines[i];
                vS = vLine.text;
                vRect.resetBounds(this._paddingLeft, vTop,
                    THCCanvas.textWidth(this.font, vS), this.font.height);

                this._newDraw(i, 1, vS.length, vRect);
            }

            this._reSetContent();
            return;
        }

        for (let i = 0; i < this.lines.count; i++) {
            vLine = this.lines[i];
            vS = vLine.text;
            if (vS != "") {
                vCharWArr = THCCanvas.getTextExtentExPoint(this.font, vS);
                vLen = vCharWArr.length;
                let j = 0, vOffset = 0, vRight = vW;
                while (j < vLen) {
                    if (vCharWArr[j] > vRight) {
                        vRect.resetBounds(this._paddingLeft, vTop, vW, this.font.height);
                        this._newDraw(i, vOffset + 1, j - vOffset, vRect);
                        if (j > 0)
                            vRight = vCharWArr[j - 1] + vW;
                        else  // 容错
                            vRight += vW;

                        vOffset = j;
                        vTop += this.font.height + this._lineSpace;
                        continue;
                    }

                    j++;
                }

                if (vOffset < vLen) {
                    vRect.resetBounds(this._paddingLeft, vTop, vW, this.font.height);
                    this._newDraw(i, vOffset + 1, vLen - vOffset, vRect);
                }
            } else {
                vRect.resetBounds(this._paddingLeft, vTop, 0, this.font.height);
                this._newDraw(i, 1, 0, vRect);
            }
        }

        this._reSetContent();
    }

    _getContentHeight() {
        if (this._drawItems.count > 0)
            return this._drawItems.last.rect.bottom - this._drawItems.first.rect.top;
        else
            return 0;
    }

    _getContentWidth() {
        if (this.hscrollBar.visible) {
            let vW = 0;
            for (let i = 0; i < this._drawItems.count; i++) {
                if (this._drawItems[i].rect.width > vW)
                    vW = this._drawItems[i].rect.width;
            }

            return vW;
        } else
            return this._drawItems[0].rect.width;
    }

    _reSetContent() {
        //let vRect = this.textArea();
        if (this.hscrollBar.visible) {
            let vW = this._getContentWidth() + this._paddingRight;
            this.hscrollBar.left = 1;
            this.hscrollBar.top = this.height - this.hscrollBar.height;
            this.hscrollBar.width = this.width - 1;
            if (this.borderVisible_) {
                vW += this.borderWidth_;
                this.hscrollBar.left += this.borderWidth_;
                this.hscrollBar.top -= this.borderWidth_;
                this.hscrollBar.width -= this.borderWidth_ + this.borderWidth_;
            }

            if (this.vscrollBar.visible)
                this.hscrollBar.width -= this.vscrollBar.width;

            this.hscrollBar.max = vW;
        }

        if (this.vscrollBar.visible) {
            let vH = this._getContentHeight() + this._paddingBottom;
            this.vscrollBar.left = this.width_ - this.vscrollBar.width;
            this.vscrollBar.top = 0;
            this.vscrollBar.height = this.height;
            if (this.borderVisible_) {
                vH += this.borderWidth_;
                this.vscrollBar.left -= this.borderWidth_;
                this.vscrollBar.top += this.borderWidth_;
                this.vscrollBar.height -= this.borderWidth_ + this.borderWidth_;
            }

            if (this.hscrollBar.visible) {
                //this.vscrollBar.height -= this.hscrollBar.height;
                this.vscrollBar.max = vH + this.hscrollBar.height;
            } else
                this.vscrollBar.max = vH;
        }
    }

    doResize_() {
        super.doResize_();
        this._reSetContent();
    }

    getDrawOffsetPosition_(selInfo) {
        return {
            x: 0,
            y: this._drawItems[selInfo.drawNo].rect.top
        }
    }

    _createCaret() {
        hcl.application.createCaret(this, null, 0, this.font.height + 1);
    }

    _destroyCaret() {
        hcl.application.destroyCaret(this);
    }

    showCaret_() {
        if (this._selStart.drawNo < 0)
            return;

        let vPt = this.getDrawOffsetPosition_(this._selStart);
        hcl.ime.updatePosition(vPt.x - 1, 0);
        hcl.application.setCaretPos(vPt.x - 1, vPt.y - 1);
        hcl.application.showCaret(this);
    }

    hideCaret_() {
        hcl.application.hideCaret(this);
    }

    dispose() {
        this._destroyCaret();        
    }

    resetSelect_() {
        if (this.selectExists())
            this.hideCaret_();
        else if (this._selStart.drawNo >= 0)
            this.showCaret_();

        this.update();
    }

    getCharOffsetAt_(x, y) {
        let vDraw, vDrawNo = -1, vOffset = -1;
        for (let i = 0; i < this._drawItems.count; i++) {
            vDraw = this._drawItems[i];
            if (y >= vDraw.rect.top && y <= vDraw.rect.bottom + this._lineSpace) {
                vDrawNo = i;
                break;
            }
        }

        if (vDrawNo < 0)
            return;

        let vS = this._getDrawText(vDrawNo);
        if (vS != "") {
            vOffset = vS.length;
            let vX = x - (this.borderVisible_ ? this.borderWidth_ : 0)
                - this.paddingLeft + this.hscrollBar.position;

            let vCharWArr = THCCanvas.getTextExtentExPoint(this.font, vS);
            for (let i = 0; i < vCharWArr.length; i++) {
                if (vCharWArr[i] > vX) {
                    if (i > 0) {
                        if (vX > vCharWArr[i] + (vCharWArr[i] - vCharWArr[i - 1]) / 2)
                            vOffset = i + 1;
                        else
                            vOffset = i;
                    } else {  // i == 0
                        if (vX > vCharWArr[0] / 2)
                            vOffset = 1;
                        else
                            vOffset = 0;
                    }

                    break;
                }
            }
        } else
            vOffset = 0;

        return {
            drawNo: vDrawNo,
            offset: vOffset
        }
    }

    scrollAdjust_() {

    }

    doSetFocus_(accept) {
        super.doSetFocus_(accept);
        if (accept) {
            this._createCaret();
            // 保证调用setFocus方法时，也能有光标显示
            this._selStart.init();
            this._selMove.init();
            this.scrollAdjust_(this._selMove);
            this.resetSelect_();
            this.doCheckImeMode_();
        }
    }

    doKillFocus_() {
        this.disSelect();
        this._selStart.init();
        this._selMove.init();
        this.hscrollBar.position = 0;
        this.vscrollBar.position = 0;
        super.doKillFocus_();
    }

    doMouseDown_(e) {
        this._mouseDownHScrollBar = false, this._mouseDownVScrollBar = false;
        let vRect;

        if (this.hscrollBar.visible) {
            vRect = this.hscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                this._mouseDownHScrollBar = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this.hscrollBar.mouseDown(vMouseArgs);
                return;
            }
        }

        if (this.vscrollBar.visible) {
            vRect = this.vscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                this._mouseDownVScrollBar = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this.vscrollBar.mouseDown(vMouseArgs);
                return;
            }
        }

        if (this.textArea().pointInAt(e.x, e.y)) {
            super.doMouseDown_(e);

            if (e.button == TMouseButton.Left) {
                this.disSelect();
                if (e.x > 0 && e.x < this.width - (this.borderVisible_ ? this.borderWidth_ : 0) - this.paddingRight) {
                    let vInfo = this.getCharOffsetAt_(e.x, e.y);
                    this._selStart.assign(vInfo);
                    this._selMove.assign(this._selStart);
                    this.scrollAdjust_(this._selMove);
                    this.resetSelect_();
                }
            } else if (this._selStart.drawNo < 0) {
                let vInfo = this.getCharOffsetAt_(e.x, e.y);
                this._selStart.assign(vInfo);
                this._selMove.assign(this._selStart);
                this.scrollAdjust_(this._selMove);
                this.resetSelect_();
            }
        }
    }

    doMouseMove_(e) {
        //let vBarHandled = false;
        if (this.hscrollBar.visible) {
            let vRect = this.hscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                //vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this.hscrollBar.mouseMove(vMouseArgs);
                this.cursor = this.hscrollBar.cursor;
                return;
            } else if (this._mouseDownHScrollBar) {
                //vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x = vRect.left;  // 约束到滚动条位置
                vMouseArgs.y -= vRect.top;
                this.hscrollBar.mouseMove(vMouseArgs);
                this.cursor = this.hscrollBar.cursor;
                return;
            }
        }

        if (this.vscrollBar.visible) {
            let vRect = this.vscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                //vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this.vscrollBar.mouseMove(vMouseArgs);
                this.cursor = this.vscrollBar.cursor;
                return;
            } else if (this._mouseDownVScrollBar) {
                //vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x = vRect.left;  // 约束到滚动条位置
                vMouseArgs.y -= vRect.top;
                this.vscrollBar.mouseMove(vMouseArgs);
                this.cursor = this.vscrollBar.cursor;
                return;
            }
        }

        // if (vBarHandled && this._hotIndex >= 0) {
        //     this._setHotIndex(-1);
        //     return;
        // }

        // if (this._mouseDownScrollBar)
        //     this._setHotIndex(-1);
        // else
        //     this._setHotIndex(this._getItemIndexAt(e.x, e.y));
        this.cursor = TCursors.Ibeam;
        super.doMouseMove_(e);
    }

    doMouseUp_(e) {
        if (this._mouseDownHScrollBar) {
            if (this.hscrollBar.visible) {
                let vRect = this.hscrollBar.bounds();
                if (vRect.pointInAt(e.x, e.y)) {
                    let vMouseArgs = new TMouseEventArgs();
                    vMouseArgs.assign(e);
                    vMouseArgs.x -= vRect.left;
                    vMouseArgs.y -= vRect.top;
                    this.hscrollBar.mouseUp(vMouseArgs);
                }
            }

            this._mouseDownHScrollBar = false;
            return;
        }
        
        if (this.hscrollBar.visible) {
            let vRect = this.hscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y))
                return;
        }

        if (this._mouseDownVScrollBar) {
            if (this.vscrollBar.visible) {
                let vRect = this.vscrollBar.bounds();
                if (vRect.pointInAt(e.x, e.y)) {
                    let vMouseArgs = new TMouseEventArgs();
                    vMouseArgs.assign(e);
                    vMouseArgs.x -= vRect.left;
                    vMouseArgs.y -= vRect.top;
                    this.vscrollBar.mouseUp(vMouseArgs);
                }
            }

            this._mouseDownVScrollBar = false;
            return;
        }
        
        if (this.vscrollBar.visible) {
            let vRect = this.vscrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y))
                return;
        }

        // if (e.button == TMouseButton.Left && this.textArea().pointInAt(e.x, e.y))
        //     this.itemIndex = this._getItemIndexAt(e.x, e.y);

        super.doMouseUp_(e);
    }

    doMouseWheel_(e) {
        if (this.vscrollBar.visible) {
            if (e.delta < 0)
                this.vscrollBar.position += 20;
            else
                this.vscrollBar.position -= 20;
        }

        super.doMouseWheel_(e);
    }

    doPaintBorder_(hclCanvas, rect) {
        hclCanvas.pen.width = this.borderWidth_;
        hclCanvas.pen.style = TPenStyle.Solid;
        if (this._readOnly)
            hclCanvas.pen.color = hcl.theme.borderColor;
        else if (this.focused)
            hclCanvas.pen.color = hcl.theme.borderActiveColor;
        else if (this.mouseIn)
            hclCanvas.pen.color = hcl.theme.borderHotColor;
        else
            hclCanvas.pen.color = hcl.theme.borderColor;
            
        hclCanvas.rectangleRect(rect);
    }

    doPaint_(hclCanvas) {
        hclCanvas.save();
        try {
            let vRect = this.textArea();
            hclCanvas.clipRect(vRect);
            this._getDisplayDraws();
            if (this._firstDraw < 0)
                return;

            hclCanvas.font.assign(this.font);
            if (!this.enabled)
                hclCanvas.font.color = hcl.theme.textDisableColor;

            let vS, vDraw;
            for (let i = this._firstDraw; i <= this._lastDraw; i++) {
                vDraw = this._drawItems[i];
                vS = this._getDrawText(i);
                hclCanvas.textOut(vDraw.rect.left - this.hscrollBar.position, vDraw.rect.top - this.vscrollBar.position, vS);
            }
        } finally {
            hclCanvas.restore();
        }

        if (this.vscrollBar.visible)
            this.vscrollBar.paintTo(hclCanvas, this.vscrollBar.left, this.vscrollBar.top);

        if (this.hscrollBar.visible)
            this.hscrollBar.paintTo(hclCanvas, this.hscrollBar.left, this.hscrollBar.top);
    }

    doPaintBackground_(hclCanvas) {
        let vRect = this.clientRect();
        // background
        vRect.left = this.paddingLeft;
        hclCanvas.brush.color = hcl.theme.backgroundContentColor;
        hclCanvas.fillRect(vRect);

        // border
        if (this.borderVisible_) {
            vRect.left -= this.borderWidth_;
            this.doPaintBorder_(hclCanvas, vRect);
        }
    }

    selectExists() {
        return false;
    }

    disSelect() {
        this._selMove = this._selStart;
        if (this.selectExists()) {
            this._selEnd = -1;
            this.resetSelect_();
        } 
    }
}

export let TValueMask = {
    Integer: 0,
    Number: 1
}

export class TNumberEdit extends TEdit {
    constructor(num) {
        super(num);
        if (!num)
            this.text_ = "0";
            
        this.valueMask_ = TValueMask.Integer;
        this.max = 0;
        this.max = 2147483647;
        this.length
    }

    doInsertText(index, text) {
        let vS = this.text.insert(index, text);
        switch (this.valueMask_) {
            case TValueMask.Integer:
                if (!(/^-?\d+$/.test(vS)))
                    return;

                break;

            case TValueMask.Number:
                if (!(/^(-?\d+)(\.\d+)?$/.test(vS) || /^(-?\d+)(\.)?$/.test(vS)))
                    return;

                break;
        }

        super.doInsertText(index, text);
    }

    doKeyDown_(e) {
        if (e.keyCode == TKey.Up) {
            let vInfo = hcl.system.tryParseInt(this.text);
            if (vInfo.ok)
                this.text = (vInfo.value + 1).toString();
        } else if (e.keyCode == TKey.Down) {
            let vInfo = hcl.system.tryParseInt(this.text);
            if (vInfo.ok)
                this.text = (vInfo.value - 1).toString();
        } else
            super.doKeyDown_(e);
    }

    get number() {
        switch (this.valueMask_) {
            case TValueMask.Number:
                return parseFloat(this.text);

            default:
                return parseInt(this.text);
        }
    }

    get valueMask() {
        return this.valueMask_;
    }

    set valueMask(val) {
        this.valueMask_ = val;
    }
}

export class TLableEdit extends TEdit {
    constructor(lableText, text) {
        super(text);
        this._lableText = lableText;
        this._paddingLeft = hcl.theme.marginSpaceDouble + THCCanvas.textWidth(this.font, this._lableText);
        this.width_ = THCCanvas.textWidth(THCCanvas.DefaultFont, lableText) + 75;
    }

    doPaintBackground_(hclCanvas) {
        hclCanvas.font.assign(THCCanvas.DefaultFont);
        hclCanvas.textOut(hcl.theme.marginSpace, this.getCharTop_(), this._lableText);
        super.doPaintBackground_(hclCanvas);
    }
}

export class TButtonEdit extends TEdit {
    constructor(text) {
        super(text);
        
        this.image = new Image(hcl.theme.iconSize, hcl.theme.iconSize);
        this.image.onload = (e) => {  // eslint-disable-line
            this._updateButtonRect();
        }

        this._paddingRight = hcl.theme.iconSize;
        this._buttonMouseIn = false;
        this._buttonDown = false;
        this._buttonRect = new TRect();
        this.calcButtonRect_();
    }

    doButtonClick_() {
        this.onButtonClick();
    }

    _updateButtonRect() {
        this.updateRect(this._buttonRect);
    }

    calcButtonRect_() {
        this._buttonRect.reset(this.width - this._paddingRight + 1,  // 让出右侧未显示内容提示线 
            this.borderWidth_, this.width - this.borderWidth_, this.height - this.borderWidth_);
    }

    doPaintBackground_(hclCanvas) {
        super.doPaintBackground_(hclCanvas);
        if (this._buttonMouseIn) {
            if (this._buttonDown)
                hclCanvas.brush.color = hcl.theme.backgroundDownColor;
            else 
                hclCanvas.brush.color = hcl.theme.backgroundHotColor;

            hclCanvas.fillRect(this._buttonRect);
        }

        if (this.image.loaded)
            hclCanvas.drawImage(this._buttonRect.left, this._buttonRect.top, this.image);
        else
            hcl.theme.drawDropDown(hclCanvas, this._buttonRect);
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        this.cursor = TCursors.Ibeam;  // 按钮点击后移出控件，为下次从非按钮移入做准备
    }

    doMouseLeave_() {
        this._buttonMouseIn = false;
        this._buttonDown = false;
        super.doMouseLeave_();
    }

    doMouseDown_(e) {
        if (this._buttonRect.pointInAt(e.x, e.y)) {
            this.hideCaret_();
            this._buttonDown = true;
            this._updateButtonRect();
            if (!this.focused)  // 首次直接点在按钮上
                super.doMouseDown_(e);
        } else {
            this._buttonDown = false;
            super.doMouseDown_(e);
        }
    }

    doMouseMove_(e) {
        if (this._buttonRect.pointInAt(e.x, e.y)) {
            if (!this._buttonMouseIn) {
                this._buttonMouseIn = true;
                this._updateButtonRect();
                this.cursor = TCursors.Default;
            }
        } else if (this._buttonMouseIn) {
            this._buttonMouseIn = false;
            this._updateButtonRect();
            this.cursor = TCursors.Ibeam;
        }

        if (!this._buttonDown)
            super.doMouseMove_(e);
    }

    doMouseUp_(e) {
        if (this._buttonDown) {
            this._buttonDown = false;
            this._updateButtonRect();
            if (this._buttonRect.pointInAt(e.x, e.y) && !this.readOnly)
                this.doButtonClick_();            
        } else
            super.doMouseUp_(e);
    }

    doDblClick_(e) {
        if (!this._buttonRect.pointInAt(e.x, e.y))
            super.doDblClick_(e);
    }

    doResize_() {
        super.doResize_();
        this.calcButtonRect_();
    }

    onButtonClick() { }
}

export class TListItem extends TObject {
    constructor() {
        super();
        this.text = "";
        this.object = null;
    }

    static Create(text, obj) {
        let vItem = new TListItem();
        vItem.text = text;
        vItem.object = obj;
        return vItem;
    }
}

export class TListItems extends TList {
    constructor(ownsObjects = true) {
        super(ownsObjects)
    }

    add(text, obj = null) {
        super.add(TListItem.Create(text, obj));
    }

    indexOf(text) {
        for (let i = 0; i < this.count; i++) {
            if (this[i].text == text)
                return i;
        }

        return -1;
    }

    indexOfObject(obj) {
        for (let i = 0; i < this.count; i++) {
            if (this[i].object === obj)
                return i;
        }

        return -1;
    }
}

export class TListBox extends TTextControl {
    constructor() {
        super("");
        this.height_ = 100;
        this._itemIndex = -1;
        this._hotIndex = -1;
        this._displayFirst = -1;
        this._displayLast = -1;
        this._paddingLeft = 2;
        this._paddingTop = 2;
        this._paddingRight = 2;
        this._paddingBottom = 2;
        this.borderVisible_ = true;
        this._mouseDownScrollBar = false;
        this._scrollBar = new TScrollBar;
        this._scrollBar.width = 20;
        this._scrollBar.orientation = TOrientation.Vertical;
        this._scrollBar.onScroll = (scrollCode, position) => {  // eslint-disable-line
            this._calcDisplayItem();
            this.update();
        }

        this._items = new TListItems();
        this._items.onAdded = (item) => {  // eslint-disable-line
            this._reSetContent();
        }

        this._items.onRemoved = (item) => {  // eslint-disable-line
            this._itemIndex = -1;
            this._hotIndex = -1;
            this._reSetContent();
        }

        this._onSelectedIndexChange = null;
    }

    _getTopOffset() {
        if (this._scrollBar.visible)
            return this._scrollBar.position;
        else
            return 0;
    }

    _calcDisplayItem() {
        if (this._items.count > 0) {
            this._displayFirst = 0;
            let vTop = this.paddingTop - this._getTopOffset() + this.font.height + hcl.theme.marginSpaceDouble;
            for (let i = 0; i < this._items.count; i++) {
                if (vTop > 0) {
                    this._displayFirst = i;
                    break;
                }
                else
                    vTop = vTop + this.font.height + hcl.theme.marginSpaceDouble;
            }

            this._displayLast = this._items.count - 1;
            for (let i = this._displayFirst; i < this._items.count; i++) {
                if (vTop > this.height_ - this.paddingBottom) {
                    this._displayLast = i;
                    break;
                }
                else
                    vTop = vTop + this.font.height + hcl.theme.marginSpaceDouble;
            }
        } else {
            this._displayFirst = -1;
            this._displayLast = -1;
        }
    }

    _getItemRect(index) {
        return TRect.CreateByBounds(this.paddingLeft, 
            index * (this.font.height + hcl.theme.marginSpaceDouble) - this._getTopOffset() + this.paddingTop + (this.borderVisible_ ? this.borderWidth_ : 0), 
            this.width - this._paddingLeft - this.paddingRight, this.font.height + hcl.theme.marginSpaceDouble);
    }

    _getItemIndexAt(x, y) {
        if (x > 0 && x < (this._scrollBar.visible ? this._scrollBar.left : this.width)) {
            let vTop = -this._getTopOffset();
            for (let i = 0; i < this._items.count; i++) {
                if (y > vTop && y <= vTop + this.font.height + hcl.theme.marginSpaceDouble)
                    return i;
                else
                    vTop += this.font.height + hcl.theme.marginSpaceDouble;
            }
        }

        return -1;
    }

    _getContentHeight() {
        return this._items.count * (this.font.height + hcl.theme.marginSpaceDouble);
    }

    _setHotIndex(val) {
        if (val != this._hotIndex) {
            let vIndex = this._hotIndex;            
            this._hotIndex = val;
            if (vIndex >= 0)
                this.updateRect(this._getItemRect(vIndex));
                
            if (this._hotIndex >= 0)
                this.updateRect(this._getItemRect(this._hotIndex));
        }
    }

    doSelectedIndexChange_() {
        if (this._onSelectedIndexChange != null)
            this._onSelectedIndexChange();
    }

    _setItemIndex(val) {
        if (val != this._itemIndex) {
            let vIndex = this._itemIndex;            
            this._itemIndex = val;
            if (vIndex >= 0)
                this.updateRect(this._getItemRect(vIndex));
                
            if (this._itemIndex >= 0 && this._itemIndex < this._items.count) {
                this.text = this._items[this._itemIndex].text;
                let vRect = this._getItemRect(this._itemIndex);
                if (vRect.top < this.paddingTop)
                    this._scrollBar.position -= this.paddingTop - vRect.top;
                else
                if (vRect.bottom > this.height - this.paddingBottom)
                    this._scrollBar.position += vRect.bottom - this.height + this.paddingBottom;
                else
                    this.update();
            } else
                this.text = "";

            this.doSelectedIndexChange_();
        }
    }

    _reSetContent() {
        let vH = this._getContentHeight();
        if (vH > this.height) {
            //this._paddingRight = this._paddingRight + this._scrollBar.width;
            //this._scrollBar.width = this._paddingRight;
            
            if (this.borderVisible_) {
                this._scrollBar.height = this.height - this.borderWidth_ - this.borderWidth_ - 1;
                this._scrollBar.left = this.width - this._scrollBar.width - this._paddingRight - this.borderWidth_ + 2;
                this._scrollBar.top = this.borderWidth_ + 1;
            } else {
                this._scrollBar.height = this.height;
                this._scrollBar.left = this.width - this._scrollBar.width - this._paddingRight;
                this._scrollBar.top = 0;
            }                

            this._scrollBar.max = vH;
            this._scrollBar.visible = true;
        } else {
            //this._paddingRight = this._paddingRight - this._scrollBar.width;
            this._scrollBar.visible = false;
        }

        this._calcDisplayItem();
        this.update();
    }

    doSetPaddingRight_(val) {
        super.doSetPaddingRight_(val);
    }

    doResize_() {
        super.doResize_();
        this._reSetContent();
    }

    doMouseEnter_() {
        super.doMouseEnter_();
        this.update();
    }

    doMouseLeave_() {
        this._hotIndex = -1;
        super.doMouseLeave_();
        this.update();
    }

    doMouseWheel_(e) {
        if (this._scrollBar.visible) {
            if (e.delta < 0)
                this._scrollBar.position += 20;
            else
                this._scrollBar.position -= 20;
        }

        super.doMouseWheel_(e);
    }

    doMouseDown_(e) {
        this._mouseDownScrollBar = false;
        if (this._scrollBar.visible) {
            let vRect = this._scrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                this._mouseDownScrollBar = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this._scrollBar.mouseDown(vMouseArgs);
                return;
            }
        }

        if (this.textArea().pointInAt(e.x, e.y))
            super.doMouseDown_(e);
    }

    doMouseMove_(e) {
        let vBarHandled = false;
        if (this._scrollBar.visible) {
            let vRect = this._scrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y)) {
                vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x -= vRect.left;
                vMouseArgs.y -= vRect.top;
                this._scrollBar.mouseMove(vMouseArgs);
            } else if (this._mouseDownScrollBar) {
                vBarHandled = true;
                let vMouseArgs = new TMouseEventArgs();
                vMouseArgs.assign(e);
                vMouseArgs.x = vRect.left;  // 约束到滚动条位置
                vMouseArgs.y -= vRect.top;
                this._scrollBar.mouseMove(vMouseArgs);
            }
        }

        if (vBarHandled && this._hotIndex >= 0) {
            this._setHotIndex(-1);
            return;
        }

        if (this._mouseDownScrollBar)
            this._setHotIndex(-1);
        else
            this._setHotIndex(this._getItemIndexAt(e.x, e.y));

        super.doMouseMove_(e);
    }

    doMouseUp_(e) {
        if (this._mouseDownScrollBar) {
            if (this._scrollBar.visible) {
                let vRect = this._scrollBar.bounds();
                if (vRect.pointInAt(e.x, e.y)) {
                    let vMouseArgs = new TMouseEventArgs();
                    vMouseArgs.assign(e);
                    vMouseArgs.x -= vRect.left;
                    vMouseArgs.y -= vRect.top;
                    this._scrollBar.mouseUp(vMouseArgs);
                }
            }

            this._mouseDownScrollBar = false;
            return;
        }
        
        if (this._scrollBar.visible) {
            let vRect = this._scrollBar.bounds();
            if (vRect.pointInAt(e.x, e.y))
                return;
        }

        if (e.button == TMouseButton.Left && this.textArea().pointInAt(e.x, e.y))
            this.itemIndex = this._getItemIndexAt(e.x, e.y);

        super.doMouseUp_(e);
    }    

    _doPaintBorder(hclCanvas, rect) {
        hclCanvas.pen.width = this.borderWidth_;
        if (this._readOnly)
            hclCanvas.pen.color = hcl.theme.borderColor;
        else if (this.focused)
            hclCanvas.pen.color = hcl.theme.borderActiveColor;
        else if (this.mouseIn)
            hclCanvas.pen.color = hcl.theme.borderHotColor;
        else
            hclCanvas.pen.color = hcl.theme.borderColor;
            
        hclCanvas.rectangleRect(rect);
    }

    _doPaintSelected(hclCanvas) { }  // eslint-disable-line

    doPaintBackground_(hclCanvas) {
        let vRect = this.clientRect();

        // background
        hclCanvas.brush.color = hcl.theme.backgroundContentColor;
        hclCanvas.fillRect(vRect);

        // selected or hot background
        if (this._itemIndex >= 0 || this._hotIndex >= 0) {
            let vTextRect = this.textArea();
            if (this._itemIndex >= 0) {
                let vItemRect = this._getItemRect(this._itemIndex);
                vItemRect = vTextRect.intersection(vItemRect);
                hclCanvas.brush.color = hcl.theme.backgroundSelectColor;
                hclCanvas.fillRect(vItemRect);
            }

            if (this._hotIndex >= 0 && this._hotIndex != this._itemIndex) {
                let vHotRect = this._getItemRect(this._hotIndex);
                vHotRect = vTextRect.intersection(vHotRect);
                hclCanvas.brush.color = hcl.theme.backgroundHotColor;
                hclCanvas.fillRect(vHotRect);
            }            
        }

        // border
        if (this.borderVisible_)
            this._doPaintBorder(hclCanvas, vRect);
    }

    doPaintText_(hclCanvas, x, y) {  // eslint-disable-line
        let vLeft = this.paddingLeft + hcl.theme.marginSpace + (this.borderVisible_ ? this.borderWidth_ : 0);
        if (this._displayLast < 0)
            return;

        hclCanvas.font.assign(THCCanvas.DefaultFont);
        let vTop = this._getItemRect(this._displayFirst).top;  // this.paddingTop - this._getTopOffset();
        for (let i = this._displayFirst; i <= this._displayLast; i++) {
            hclCanvas.textOut(vLeft, vTop + hcl.theme.marginSpace, this._items[i].text);
            vTop += this.font.height + hcl.theme.marginSpaceDouble;
        }
    }

    doSetBorderVisible_() {
        this._reSetContent();
        super.doSetBorderVisible_();
    }

    doPaint_(hclCanvas) {
        let vRect = this.textArea();
        hclCanvas.save();
        try {
            hclCanvas.clipRect(vRect);
            this.doPaintText_(hclCanvas, this.paddingLeft, this.paddingTop);
        } finally {
            hclCanvas.restore();
        }

        if (this._scrollBar.visible) {
            vRect = this.clientRect();
            hclCanvas.save();
            try {
                hclCanvas.clipRect(vRect);
                this._scrollBar.paintTo(hclCanvas, this._scrollBar.left, this._scrollBar.top);
            } finally {
                hclCanvas.restore();
            }
        }
    }

    dispose() {
        this._items.clear();        
    }

    textArea() {
        let rect = super.textArea();
        if (this._scrollBar.visible)
            rect.right = rect.right - this._scrollBar.width + 2;

        return rect;
    }

    addItem(text, obj = null) {
        this._items.add(text, obj);
    }

    deleteItem(index) {
        if (index >= 0 && index < this._items.count)
            this._items.removeAt(index);
    }

    itemIndexOf(text) {
        return this._items.indexOf(text);
    }

    get items() {
        return this._items;
    }

    set items(val) {
        this._items = val;
        this._reSetContent();
    }

    get selectItem() {
        if (this._itemIndex >= 0)
            return this._items[this._itemIndex];
        else
            return null;
    }

    get itemIndex() {
        return this._itemIndex;
    }

    set itemIndex(val) {
        this._setItemIndex(val);
    }

    get contentHeight() {
        return this._getContentHeight();
    }

    get onSelectedIndexChange() {
        return this._onSelectedIndexChange;
    }

    set onSelectedIndexChange(val) {
        this._onSelectedIndexChange = val;
    }
}

export class TCombobox extends TButtonEdit {
    constructor(text) {
        super(text);
        this.popupAlign_ = TAlign.Left;
        this.DropDownWidth_ = 100;
        this.dropDownCount_ = 8;
        this.static_ = false;
        this.popupDownInTextArea_ = false;
        this.onSelectedIndexChange_ = null;
        this._listBox = new TListBox();
        this._listBox.paddingLeft = 0;
        this._listBox.paddingTop = 0;
        this._listBox.paddingRight = 0;
        this._listBox.paddingBottom = 0;
        //this._listBox.canFocus = false;
        this._listBox.onUpdate = (rect) => {
            this._listBoxUpdate(rect);
        }

        this._popupControl = null;
    }

    doKeyDown_(e) {
        if (!this.readOnly && this.items.count > 0) {
            if (e.keyCode == TKey.Up && this.itemIndex > 0)
                this.itemIndex--;
            else if (e.keyCode == TKey.Down && this.itemIndex < this.items.count - 1)
                this.itemIndex++;
        }
        
        if (!this.static_)
            super.doKeyDown_(e);
    }

    doKeyPress_(e) {
        if (!this.static_)
            super.doKeyPress_(e);
    }

    insertText(index, text) {
        if (!this.static_)
            super.insertText(index, text)
    }

    _listBoxUpdate(rect) {
        if (this._popupControl != null)
            this._popupControl.updateRect(rect);
    }

    _popup() {
        if (this._popupControl == null) {
            this._listBox.width = this.DropDownWidth_;
            this._listBox.itemIndex = this._listBox.itemIndexOf(this.text);
            let vDropH = this.dropDownCount_ * (this._listBox.font.height + hcl.theme.marginSpaceDouble);
            let vContentH = this._listBox.contentHeight;
            if (vContentH > vDropH)
                this._listBox.height = vDropH;
            else
                this._listBox.height = vContentH;

            this._popupControl = new TPopupControl();
            this._popupControl.width = this._listBox.width;
            this._popupControl.height = this._listBox.height;
            this._popupControl.dropDownStyle = true;
            this._popupControl.onClose = () => {
                this._popupControl = null;
            }

            this._popupControl.onDone = () => {  // 选项选择完成
                this.doSelectedIndexChange_();
            }

            this._popupControl.onPaint = (hclCanvas) => {
                this._listBox.paintTo(hclCanvas, 0, 0);
            }

            this._popupControl.onMouseEnter = () => {
                this._listBox.mouseEnter();
            }

            this._popupControl.onMouseLeave = () => {
                this._listBox.mouseLeave();
            }

            this._popupControl.onMouseWheel = (e) => {
                this._listBox.mouseWheel(e);
            }

            this._popupControl.onMouseDown = (e) => {
                this.popupDownInTextArea_ = this._listBox.textArea().pointInAt(e.x, e.y);
                this._listBox.mouseDown(e);
            }

            this._popupControl.onMouseMove = (e) => {
                this._listBox.mouseMove(e);
            }

            this._popupControl.onMouseUp = (e) => {
                this._listBox.mouseUp(e);
                if (this.popupDownInTextArea_ && this._listBox.textArea().pointInAt(e.x, e.y))
                    this.doDonePopup_();  // 准备完成选择
            }
        }

        let vPoint = this.clientToScreen(TPoint.Create(0, 0));
        if (this.popupAlign_ == TAlign.Left)
            vPoint.x += this.paddingLeft - (this.borderVisible_ ? this.borderWidth_ : 0);
        else
            vPoint.x += this.width - this._popupControl.width;

        this._popupControl.popup(vPoint.x, vPoint.y + this.height, true);
    }

    doDonePopup_() {
        this._popupControl.donePopup();  // popupControl进入完成选择流程，触发onDone事件
    }

    doSelectedIndexChange_() {
        this.text = this._listBox.text;
        if (this.onSelectedIndexChange_ != null)
            this.onSelectedIndexChange_();
    }

    doButtonClick_() {
        if (!this.readOnly)
            this._popup();

        super.doButtonClick_();
    }

    addItem(text, obj = null) {
        this._listBox.addItem(text, obj);
    }

    removeItem(index) {
        this._listBox.removeItem(index);
    }

    itemIndexOf(text) {
        return this._listBox.itemIndexOf(text);
    }

    get dropDownWidth() {
        return this.DropDownWidth_;
    }

    set dropDownWidth(val) {
        this.DropDownWidth_ = val;
    }

    get itemIndex() {
        return this._listBox.itemIndex;
    }

    set itemIndex(val) {
        this._listBox.itemIndex = val;
        this.text = this._listBox.text;
    }

    get items() {
        return this._listBox.items;
    }

    get static() {
        return this.static_;
    }

    set static(val) {
        this.static_ = val;
    }

    get onSelectedIndexChange() {
        return this.onSelectedIndexChange_;
    }

    set onSelectedIndexChange(val) {
        this.onSelectedIndexChange_ = val;
    }
}

export class TFontCombobox extends TCombobox {
    constructor() {
        super();
        this.static_ = true;
        let vDetect = new TFontDetector();
        if (vDetect.detect("宋体"))
            this.addItem("宋体");

        if (vDetect.detect("幼圆"))
            this.addItem("幼圆");

        if (vDetect.detect("楷体"))
            this.addItem("楷体");

        if (vDetect.detect("隶书"))
            this.addItem("隶书");

        if (vDetect.detect("黑体"))
            this.addItem("黑体");

        if (vDetect.detect("Arial"))
            this.addItem("Arial");

        if (vDetect.detect("Tahoma"))
            this.addItem("Tahoma");

        if (vDetect.detect("Calibri"))
            this.addItem("Calibri");

        if (vDetect.detect("Courier New"))
            this.addItem("Courier New");

        this.itemIndex = 0;
    }
}

export class TColorPad extends TCustomControl {
    constructor(width = 200) {
        super();
        this._colorBand = 50;
        this.width_ = width;
        this.height_ = width + this._colorBand;
        this._iniHotColor();
        this._color = TColor.White;
        this._imageData = TColor.getColorPad(Math.round(width / 2));

        this._edtR = new TEdit();
        this._edtR.hint = "颜色的R值";
        this._edtR.parent = this;
        this._edtR.left = 20;
        this._edtR.top = width + 5;
        this._edtR.width = 40;
    }

    _iniHotColor() {
        let vC = TColor.colorToRGBA(this._color);
        this._R = vC.r;
        this._G = vC.g;
        this._B = vC.b;
        this._A = vC.a;
    }

    _setColor(val) {
        if (this._color != val) {
            this._color = val;
            this._iniHotColor();
            this.update();
        }
    }

    doPaintBackground_(hclCanvas) {
        //super.doPaintBackground_(hclCanvas);
        hclCanvas.brush.color = this.hotColor;
        hclCanvas.fillRect(this.clientRect());
        hclCanvas.drawImageData(this._imageData, 0, 0, this.width, this.height);
    }

    doPaint_(hclCanvas) {
        super.doPaint_(hclCanvas);
    }

    doMouseLeave_() {
        super.doMouseLeave_();
        this._iniHotColor();
        this.update();
    }

    doMouseMove_(e) {
        super.doMouseMove_(e);
        if (THCCanvas.pointInEllipseBounds(0, 0, this.width_, this.width_, e.x, e.y)) {
            let vOffset = (this.width_ * e.y + e.x) * 4;
            this._R = this._imageData.data[vOffset];
            this._G = this._imageData.data[vOffset + 1];
            this._B = this._imageData.data[vOffset + 2];
            this._A = this._imageData.data[vOffset + 3];
        } else
            this._iniHotColor();

        this.update();
    }

    doClick_() {
        this._color = this.hotColor;
        super.doClick_();
    }

    get hotColor() {
        return TColor.rgbaToColor(this._R, this._G, this._B, this._A);
    }

    get color() {
        return this._color;
    }

    set color(val) {
        this._setColor(val);
    }
}

export class TColorCombobox extends TCombobox {
    constructor(color = "rgb(0, 0, 0)") {
        super(color);
        this.width_ = 36;
        this.height_ = 20;
        this.canFocus = false;
        this.dropDownCount_ = 16;
        this.imeMode = TImeMode.Disabled;
        this.dropDownWidth = 64;
        this.addItem(TColor.Black);
        this.addItem(TColor.Red);
        this.addItem(TColor.Green);
        this.addItem(TColor.Blue);
        this.addItem(TColor.Yellow);
        this.addItem(TColor.Gray);
        //this.addItem(TColor.Magenta);
        //this.addItem(TColor.Purple);
        //this.addItem(TColor.Teal);
        //this.addItem(TColor.DarkGreen);
        this.addItem(TColor.Orange);
        //this.addItem(TColor.DarkRed);
        this.addItem("更多...");

        this._listBox.doPaintBackground_ = (hclCanvas) => { this._listBoxPaintBackground(hclCanvas); }
        this._listBox.doPaintText_ = (hclCanvas, x, y) => { this._listBoxPaintText(hclCanvas, x, y); }

        this._pad = new TColorPad();
        this._pad.align = TAlign.Client;
        this._pad.paddingLeft = 0;
        this._pad.paddingTop = 0;
        this._pad.paddingRight = 0;
        this._pad.paddingBottom = 0;
        this._pad.onClick = () => { this._padClick(); }

        this._popupPadControl = null;
    }

    _listBoxPaintBackground(hclCanvas) {
        let vRect = this._listBox.clientRect();
        hclCanvas.brush.color = hcl.theme.backgroundContentColor;
        hclCanvas.fillRect(vRect);
        if (this._listBox.borderVisible_)
            this._listBox._doPaintBorder(hclCanvas, vRect);
    }

    _listBoxPaintText(hclCanvas, x, y) {
        if (this._listBox._displayLast < 0)
            return;

        let vBackRect = new TRect();
        let vRect = this._listBox._getItemRect(this._listBox._displayFirst);
        vRect.inFlate(-1, 0);
        for (let i = this._listBox._displayFirst; i <= this._listBox._displayLast; i++) {
            if (i == this._listBox.items.count - 1) {
                hclCanvas.brush.color = TColor.White;
                vBackRect.resetRect(vRect);
                hclCanvas.textOut(vRect.left + this._listBox.paddingLeft + hcl.theme.marginSpace, 
                    vRect.top + hcl.theme.marginSpace, this._listBox._items[i].text);
            } else {
                hclCanvas.brush.color = this._listBox._items[i].text;
            
                vBackRect.resetRect(vRect);
                vBackRect.inFlate(-1, 0);
                hclCanvas.fillRect(vBackRect);
            }

            if (this._listBox._itemIndex == i) {
                hclCanvas.pen.color = hcl.theme.borderActiveColor;
                hclCanvas.rectangleRect(vRect);
            }

            if (this._listBox._hotIndex == i) {
                hclCanvas.pen.color = hcl.theme.borderHotColor;
                hclCanvas.rectangleRect(vRect);
            }

            vRect.offset(0, this._listBox.font.height + hcl.theme.marginSpaceDouble);
        }
    }

    _padClick() {
        this._popupPadControl.donePopup();
        this._listBox.text = this._pad.color;
        super.doSelectedIndexChange_();
    }

    doDonePopup_() {
        if (this._listBox.itemIndex == this._listBox.items.count - 1)
            this._popupPad();
        else
            super.doDonePopup_();
    }

    _popupPad() {
        if (this._popupPadControl == null) {
            this._pad.color = this.text;
            this._popupPadControl = new TPopupWinControl();
            this._popupPadControl.width = this._pad.width;
            this._popupPadControl.height = this._pad.height;
            this._pad.parent = this._popupPadControl;
            //this._popupPadControl.dropDownStyle = true;
            this._popupPadControl.onClose = () => {
                this._popupPadControl = null;
            }

            this._popupPadControl.onDone = () => {
                this._listBox.text = this._pad.color;
            }

            if (this._popupControl != null)
                this._popupPadControl.popup(this._popupControl.right, this._popupControl.top, false);
            else {
                let vPoint = this.clientToScreen(TPoint.Create(0, 0));
                if (this.popupAlign_ == TAlign.Left)
                    vPoint.x += this.paddingLeft - (this.borderVisible_ ? this.borderWidth_ : 0);
                else
                    vPoint.x += this.width - this._popupControl.width;

                this._popupPadControl.popup(vPoint.x, vPoint.y + this.height, true);
            }
        }
    }

    doSetFocus_() {
        //super.doSetFocus_();
    }

    showCaret_() { }

    doPaintSelected_(hclCanvas) { }

    doPaintBackground_(hclCanvas) {
        let vRect = this.clientRect();
        vRect.left = this.paddingLeft;
        hclCanvas.brush.color = hcl.theme.backgroundContentColor;
        hclCanvas.fillRect(vRect);

        if (this.borderVisible_) {
            vRect.left -= this.borderWidth_;
            this.doPaintBorder_(hclCanvas, vRect);
        }

        if (this._buttonMouseIn) {
            if (this._buttonDown)
                hclCanvas.brush.color = hcl.theme.backgroundDownColor;
            else 
                hclCanvas.brush.color = hcl.theme.backgroundHotColor;

            hclCanvas.fillRect(this._buttonRect);
        }

        if (this.image.loaded)
            hclCanvas.drawImage(this._buttonRect.left, this._buttonRect.top, this.image);
        else
            hcl.theme.drawDropDown(hclCanvas, this._buttonRect);

        vRect = this.textArea();
        hclCanvas.brush.color = this.color;
        hclCanvas.fillRect(vRect);
    }

    doPaint_(hclCanvas) { }

    doMouseMove_(e) {
        super.doMouseMove_(e);
        this.cursor = TCursors.Default;
    }

    doMouseUp_(e) {
        if (this._buttonDown)
            super.doMouseUp_(e);
        else
            this.doButtonClick_(); 
    }

    get color() {
        return this.text;
    }

    set color(val) {
        this.text = val;
    }
}

class TCustomMenuItem extends TObject {
    constructor(text) {
        super();
        this.text = text;
        this.subItems = new TList();
        this.enabled = true;
        this.visible = true;
        this.left = 0;
        this.top = 0;
        this.shortCut = 0;
        this.width = hcl.theme.popupMenuImagePadding + hcl.theme.marginSpaceDouble;
        this.height = hcl.theme.marginSpaceDouble;
    }

    paint(hclCanvas) {
        let vTop;
        if (!this.isSpliter) {
            vTop = this.top + Math.trunc((this.height - hclCanvas.font.height) / 2);
            hclCanvas.textOut(this.left + hcl.theme.popupMenuImagePadding + hcl.theme.marginSpace, vTop, this.text);
            if (this.subItems.count > 0)
                hcl.theme.drawDropRight(hclCanvas, TRect.CreateByBounds(this.left + this.width - hcl.theme.iconSize, this.top, hcl.theme.iconSize, this.height));
        } else {
            hclCanvas.pen.width = 1;
            hclCanvas.pen.color = TColor.Gray;
            vTop = this.top + Math.trunc(this.height / 2);
            hclCanvas.drawLineDriect(this.left + hcl.theme.popupMenuImagePadding, vTop,
                this.left + this.width - hcl.theme.marginSpace, vTop);
        }
    }

    bounds() {
        return TRect.CreateByBounds(this.left, this.top, this.width, this.height);
    }

    get isSpliter() {
        return this.text == "-";
    }    
}

class TMenuItem extends TCustomMenuItem {
    constructor(text) {
        super(text);
        this._popupControl = null;
        this.dropDownStyle = false;
        this.image = TImage.Create(16, 16);
        this._onClick = null;
        this.onPopup = null;
    }

    _closePopupControl_() {
        if (this._popupControl != null)
            this._popupControl.close();
    }

    paint(hclCanvas) {
        if (!this.enabled)
            hclCanvas.font.color = hcl.theme.textDisableColor;
        else
            hclCanvas.font.color = hcl.theme.textColor;
        
        super.paint(hclCanvas);
    }

    visibleCount() {
        let vCount = 0;
        for (let i = 0; i < this.subItems.count; i++)
            if (this.subItems[i].visible)
                vCount++;

        return vCount;
    }

    addItem(text) {
        let vItem = new TMenuItem(text);
        this.subItems.add(vItem);
        return vItem;
    }

    addControl(control) {
        // to do: new TMenuItemControl
        this.subItems.add(control);
    }

    addSpliter() {
        return this.addItem("-");
    }

    popup(x, y, root = true) {
        if (this._popupControl == null) {  // 不判断this.visibleCount() > 0 给onPopup机会显示已经隐藏的菜单
            if (this.onPopup != null)
                this.onPopup();

            this._popupControl = new TPopupMenuControl(this);  // 创建并计算PopupControl的大小
            this._popupControl.dropDownStyle = this.dropDownStyle;
            this._popupControl.onClose = () => {
                this._popupControl = null;
            }

            this._popupControl.popup(x, y, root);
        }
    }

    popupControl(control, root = true) {
        let vPoint = control.clientToScreen(TPoint.Create(0, 0));
        this.popup(vPoint.x, vPoint.y + control.height, root);
    }

    get hasSubItem() {
        return this.subItems.count > 0;
    }

    get onClick() {
        return this._onClick;
    }

    set onClick(val) {
        this._onClick = val;
    }
}

export class TPopupMenu extends TMenuItem {
    constructor() {
        super("");
    }
}

class TPopupMenuControl extends TPopupControl {
    constructor(menuItem) {
        super();
        this.font = new TFont();
        this._mouseMoveIndex = -1;
        this.menuItem = menuItem;
        this.adjustPosition = true;
        this._calcPopupControl();
    }

    _calcPopupControl() {
        let vHeight = 0, vTop = 0, vMaxWidth = 100; 
        let vItem = null;

        // TAlign.alTop
        for (let i = 0, vCount = this.menuItem.subItems.count; i < vCount; i++) {
            vItem = this.menuItem.subItems[i];
            if (vItem.visible) {
                vItem.left = 0;
                vItem.top = vTop;
                
                if (vItem.isSpliter) {
                    vItem.width = hcl.theme.marginSpaceDouble;
                    vItem.height = hcl.theme.marginSpace;
                } else {
                    vItem.width = hcl.theme.popupMenuImagePadding + hcl.theme.marginSpace
                        + THCCanvas.textWidth(this.font, vItem.text) + hcl.theme.iconSize;

                    vItem.height = this.font.height + hcl.theme.marginSpaceDouble;
                }

                if (vMaxWidth < vItem.width)
                    vMaxWidth = vItem.width;

                vTop = vItem.top + vItem.height;
                vHeight += vItem.height;
            }
        }

        for (let i = 0, vCount = this.menuItem.subItems.count; i < vCount; i++) {
            vItem = this.menuItem.subItems[i];
            if (vItem.visible)
                vItem.width = vMaxWidth;
        }

        this.width = vMaxWidth;
        this.height = vHeight;
    }

    _getItemIndexAt(x, y) {
        for (let i = 0; i < this.menuItem.subItems.count; i++) {
            if (!this.menuItem.subItems[i].isSpliter && this.menuItem.subItems[i].visible && this.menuItem.subItems[i].bounds().pointInAt(x, y))
                return i;
        }

        return -1;
    }

    _getItemAt(x, y) {
        let vIndex = this._getItemIndexAt(x, y);
        if (vIndex >= 0)
            return this.items[vIndex];

        return null;
    }

    getHint_() {
        if (this._mouseMoveIndex >= 0) {
            let vHint = this.menuItem.subItems[this._mouseMoveIndex].hint;
            if (hcl.system.assigned(vHint) && (vHint != ""))
                return vHint;
            else
                return super.getHint_();
        } else
            return super.getHint_();
    }

    doMouseMove_(e) {
        super.doMouseMove_(e);
        let vIndex = this._getItemIndexAt(e.x, e.y);
        if (this._mouseMoveIndex != vIndex) {
            if (this._mouseMoveIndex >= 0)
                this.menuItem.subItems[this._mouseMoveIndex]._closePopupControl_();

            this._mouseMoveIndex = vIndex;
            if (this._mouseMoveIndex >= 0) {
                let vItem = this.menuItem.subItems[this._mouseMoveIndex];
                if (vItem.visible && vItem.enabled)
                    vItem.popup(this.left + this.width, this.top + vItem.top, false);
            }
            
            this.update();
        }
    }

    doMouseUp_(e) {
        super.doMouseUp_(e);
        if (this._mouseMoveIndex >= 0) {
            let vItem = this.menuItem.subItems[this._mouseMoveIndex];
            if (vItem.enabled && vItem.onClick != null) {
                vItem.onClick();
                this.donePopup();
            }
        }
    }

    doPaintBackground_(hclCanvas) {
        super.doPaintBackground_(hclCanvas);
        if (this._mouseMoveIndex >= 0) {
            let vItem = this.menuItem.subItems[this._mouseMoveIndex];
            if (!vItem.isSpliter && vItem.visible) {
                if (vItem.enabled)
                    hclCanvas.brush.color = hcl.theme.backgroundSelectColor;
                else
                    hclCanvas.brush.color = hcl.theme.backgroundHotColor;

                hclCanvas.fillRect(vItem.bounds());
            }
        }

        hclCanvas.pen.width = 1;
        hclCanvas.pen.color = TColor.Gray;
        hclCanvas.drawLineDriect(hcl.theme.popupMenuImagePadding, 0, hcl.theme.popupMenuImagePadding, this.height);
    }

    doPaint_(hclCanvas) {
        super.doPaint_(hclCanvas);
        hclCanvas.font.assign(this.font);
        for (let i = 0, vCount = this.menuItem.subItems.count; i < vCount; i++) {
            if (this.menuItem.subItems[i].visible)
                this.menuItem.subItems[i].paint(hclCanvas);
        }
    }

    getHintRect() {
        if (this._mouseMoveIndex >= 0) {
            let vHint = this.menuItem.subItems[this._mouseMoveIndex].hint;
            if (hcl.system.assigned(vHint) && (vHint != ""))
                return this.menuItem.subItems[this._mouseMoveIndex].bounds();
            else
                return super.getHintRect();
        } else
            return super.getHintRect();
    }
}

export class TScrollPanel extends TPanel {
    constructor() {
        super();
        this.state_.add(TControlState.Creating);
        this.contentHeight_ = 0;
        this.contentWidth_ = 0;
        this.HScroll_ = new TScrollBar();
        this.HScroll_.orientation = TOrientation.Horizontal;
        this.HScroll_.onScroll = () => { this.viewScroll_(); }
        this.addControl(this.HScroll_);

        this.VScroll_ = new TScrollBar();
        this.VScroll_.orientation = TOrientation.Vertical;
        this.VScroll_.onScroll = () => { this.viewScroll_(); }
        this.addControl(this.VScroll_);
        this.state_.delete(TControlState.Creating);
    }

    viewScroll_() {
        this.update();
    }

    doResize_() {
        super.doResize_();
        this.doContentResize_();
    }

    doAlign_() {
        super.doAlign_();

        if (this.VScroll_.visible)
            this.HScroll_.width = this.width - this.VScroll_.width;
        else
            this.HScroll_.width = this.width;

        if (this.HScroll_.visible)
            this.VScroll_.height = this.height - this.HScroll_.height;
        else
            this.VScroll_.height = this.height;
    }

    calcContentSize_() {
        this.contentHeight_ = 0;
        this.contentWidth_ = 0;
    }

    doContentResize_() {
        this.calcContentSize_();

        this.VScroll_.visible = this.contentHeight_ > this.height;
        this.VScroll_.max = this.contentHeight_;

        this.VScroll_.visible = this.contentHeight_ > this.height;
        this.VScroll_.max = this.contentHeight_;

        this.HScroll_.visible = this.contentWidth_ > this.width;
        this.HScroll_.max = this.contentWidth_;

        if (this.HScroll_.visible) {
            if (this.contentHeight_ + this.HScroll_.height > this.height) {
                this.VScroll_.visible = true;
                this.VScroll_.max = this.contentHeight_ + this.HScroll_.height;
            }
        }

        if (this.VScroll_.visible) {
            if (this.contentWidth_ + this.VScroll_.width > this.width) {
                this.HScroll_.visible = true;
                this.HScroll_.max = this.contentWidth_ + this.VScroll_.width;
            }
        }

        if (!this.HScroll_.visible)
            this.HScroll_.position = 0;
        else {
            if (this.VScroll_.visible)
                this.HScroll_.width = this.width - this.VScroll_.width;
            else
                this.HScroll_.width = this.width;
        }

        if (!this.VScroll_.visible)
            this.VScroll_.position = 0;
        else {
            if (this.HScroll_.visible)
                this.VScroll_.height = this.height - this.HScroll_.height;
            else
                this.VScroll_.height = this.height;
        }
    }

    doMouseWheel_(e) {
        if (hcl.keyDownStates[TKey.ShiftKey])
            this.HScroll_.position -= e.delta;
        else
            this.VScroll_.position -= e.delta;
    }
}

class TPage extends TCustomControl {
    constructor(text = "page") {
        super();
        this._headerRect_ = new TRect();
        this._visible = true;
        this.text_ = text;
        this.onUpdateText = null;
    }

    doPaintBackground_(e) { }

    updateText() {
        if (this.onUpdateText != null)
            this.onUpdateText(this);
    }

    get text() {
        return this.text_;
    }

    set text(val) {
        if (this.text_ != val) {
            this.text_ = val;
            this.updateText();
        }
    }
}

export class TPageControl extends TPanel {
    constructor() {
        super();
        this.width = 200;
        this.height = 200;
        this._showCloseButton = false;
        this._headerHeight = 20;
        this._headerOffset = 0;
        this._headerVisible = true;
        this._activePageIndex = -1;
        this._hotHeaderIndex = -1;
        this._hotBtnPageIndex = -1;
        this.paddingTop = this._headerHeight;
    }

    doPageUpdateHeaderText(page) {
        if (page.visible) {
            this._formatHeader(page);
            this.updateRect(TRect.CreateByBounds(0, 0, this.width, this._headerHeight));
        }
    }

    _formatHeader(page) {
        let vW = THCCanvas.textWidth(THCCanvas.DefaultFont, page.text);
        if (this._showCloseButton)
            vW += hcl.theme.iconWidth;

        page._headerRect_.resetBounds(0, 0, vW + hcl.theme.marginSpaceDouble, this._headerHeight);
        let vLeft = 0, vPage;
        for (let i = 0; i < this.controls.count; i++) {
            vPage = this.controls[i];
            vPage._headerRect_.resetBounds(vLeft, 0, vPage._headerRect_.width, vPage._headerRect_.height);
            vLeft += vPage._headerRect_.width;
        }
    }

    _formatAllHeader() {
        for (let i = 0; i < this.controls.count; i++)
            this._formatHeader(this.controls[i]);
    }

    doAddControl_(page) {
        if (!page.isClass(TPage)) {
            hcl.exception("只能添加TPage及其子类");
            return;
        }

        page.align = TAlign.Client;
        page.onUpdate = (rect) => { this.doPageUpdateRect(page, rect); }
        page.onUpdateText = (page) => { this.doPageUpdateHeaderText(page); }
        this._formatHeader(page);
        this.pageIndex = this.controls.count - 1;
        super.doAddControl_(page);
    }

    doRemoveControl_(page) {
        this._formatAllHeader();
        if (this.controls.count == 0)
            this._activePageIndex = -1;
        else if (this._activePageIndex > this.controls.count - 1)
            this.pageIndex = this.controls.count - 1;

        super.doRemoveControl_(page);
    }

    doPaintBorder_(hclCanvas) {
        if (!this._headerVisible)
            super.doPaintBorder_(hclCanvas);
        else if (this.borderVisible_) {
            if (this.controls.count > 0) {
                hclCanvas.pen.color = hcl.theme.borderColor;
                hclCanvas.pen.width = hcl.theme.borderWidth;
                hclCanvas.beginPath();
                hclCanvas.moveTo(0, this._headerHeight);
                hclCanvas.lineTo(0, this.height - 1);
                hclCanvas.lineTo(this.width, this.height - 1);
                hclCanvas.lineTo(this.width, this._headerHeight);
                hclCanvas.paintPath();
            } else
                super.doPaintBorder_(hclCanvas);
        }
    }

    doPaintPageHeader(hclCanvas) {
        let vPage;
        hclCanvas.font.assign(THCCanvas.DefaultFont);  //.color = theme.textColor;
        for (let i = 0; i < this.controls.count; i++) {
            vPage = this.controls[i];
            hclCanvas.textOut(vPage._headerRect_.left + hcl.theme.marginSpace, vPage._headerRect_.top + hcl.theme.marginSpace, vPage.text);

            if (i == this._hotBtnPageIndex) {
                hclCanvas.brush.color = hcl.theme.backgroundHotColor;
                hclCanvas.fillBounds(vPage._headerRect_.right - hcl.theme.iconWidth, vPage._headerRect_.top, hcl.theme.iconWidth, hcl.theme.iconWidth);
            }

            if (i == this._activePageIndex) {
                if (this._showCloseButton)
                    hclCanvas.drawImage(vPage._headerRect_.right - hcl.theme.iconWidth, vPage._headerRect_.top + 2, hcl.theme.closeImage);

                hclCanvas.pen.color = hcl.theme.borderColor;
                hclCanvas.pen.width = hcl.theme.borderWidth;
                hclCanvas.beginPath();
                hclCanvas.moveTo(0, this._headerHeight);
                hclCanvas.lineTo(vPage._headerRect_.left + 1, this._headerHeight);
                hclCanvas.lineTo(vPage._headerRect_.left + 1, 0);
                hclCanvas.lineTo(vPage._headerRect_.right, 0);
                hclCanvas.lineTo(vPage._headerRect_.right, this._headerHeight);
                hclCanvas.lineTo(this.width, this._headerHeight);
                hclCanvas.paintPath();
            } else if (this._showCloseButton && (i == this._hotHeaderIndex))
                hclCanvas.drawImage(vPage._headerRect_.right - hcl.theme.iconWidth, vPage._headerRect_.top + 2, hcl.theme.closeImage);
        }
    }

    doPaintBackground_(hclCanvas) {
        super.doPaintBackground_(hclCanvas);
    }

    doPaint_(hclCanvas) {
        //super.doPaint_();
        if (this._activePageIndex >= 0) {
            let vPage = this.controls[this._activePageIndex];
            hclCanvas.save();
            try {
                hclCanvas.translate(vPage.left, vPage.top);
                hclCanvas.clip(0, 0, vPage.width, vPage.height);
                vPage.paint(hclCanvas);
            } finally {
                hclCanvas.restore();
            }
        }

        if (this.borderVisible)
            this.doPaintBorder_(hclCanvas);  // 如果用super.doPaintBorder则会实现四周边框

        if (this._headerVisible)
            this.doPaintPageHeader(hclCanvas);
    }

    _pageHeaderIndexAt(x, y) {
        if (this._headerVisible) {
            let vRect = new TRect();
            for (let i = 0; i < this.controls.count; i++) {
                vRect.resetRect(this.controls[i]._headerRect_);
                vRect.offset(-this._headerOffset, 0);
                if (vRect.pointInAt(x, y))
                    return i;
            }
        }

        return -1;
    }

    getControlAt(x, y, enabled = true) {
        if (this._headerVisible && y < this._headerHeight)
            return null;

        if (this._activePageIndex >= 0) {
            let vControl = this.controls[this._activePageIndex];
            if (enabled && vControl.enabled)
                return vControl;
        }

        return super.getControlAt(x, y, enabled);
    }    

    doMouseDown_(e) {
        if (this._headerVisible && e.y < this._headerHeight) {
            let vIndex = this._pageHeaderIndexAt(e.x, e.y);
            if (vIndex >= 0 && vIndex != this._activePageIndex)
                this.pageIndex = vIndex;
        } else
            super.doMouseDown_(e);
    }

    doMouseMove_(e) {
        if (this._headerVisible) {
            let vRepaintHeader = false, vBtnInPage = -1;
            let vIndex = this._pageHeaderIndexAt(e.x, e.y);
            if (vIndex != this._hotHeaderIndex) {
                this._hotHeaderIndex = vIndex;
                vRepaintHeader = true;
            }

            if (this._hotHeaderIndex >= 0) {
                let vPage = this.controls[this._hotHeaderIndex];
                if (e.x > vPage._headerRect_.right - hcl.theme.iconWidth) {
                    if (vPage._headerRect_.pointInAt(e.x, e.y))
                        vBtnInPage = this._hotHeaderIndex;
                }
            }

            if (this._hotBtnPageIndex != vBtnInPage) {
                this._hotBtnPageIndex = vBtnInPage;
                vRepaintHeader = true;
            }

            if (vRepaintHeader)
                this.updateRect(TRect.CreateByBounds(0, 0, this.width, this._headerHeight));
        }

        super.doMouseMove_(e);
    }

    doMouseUp_(e) {
        if (this._headerVisible && e.y < this._headerHeight) {
            //let vIndex = this._pageHeaderIndexAt(e.x, e.y);
            let vPage = this.controls[this._activePageIndex];
            if (this._activePageIndex >= 0 && e.x > vPage._headerRect_.right - hcl.theme.iconWidth && e.x < vPage._headerRect_.right)
                this.closePage(this._activePageIndex);
        } else
            super.doMouseUp_(e);
    }

    closePage(pageIndex) {
        // if (this._activePageIndex == pageIndex) {
        //     if (pageIndex == 0) {
        //         if (pageIndex < this.controls.count - 1)
        //             this.pageIndex = pageIndex + 1;
        //         else
        //             this._activePageIndex = -1;
        //     } else
        //         this.pageIndex = pageIndex - 1;
        // }

        this.beginUpdate();
        try {
            this.controls.removeAt(pageIndex);
        } finally {
            this.endUpdate();
        }
        // if (this.controls.count == 0)
        //     this._activePageIndex = -1;
        // else if (this._activePageIndex > this.controls.count - 1)
        //     this.pageIndex = this.controls.count - 1;

        //this.endUpdate();
    }

    addPage(text) {
        let vPage = new TPage(text);
        this.addControl(vPage);
        return vPage;
    }

    get pageIndex() {
        return this._activePageIndex;
    }

    set pageIndex(val) {
        if (val >= 0 && val < this.controls.count) {
            if (val != this._activePageIndex) {
                if (this._activePageIndex >= 0 && this._activePageIndex < this.controls.count)
                    this.controls[this._activePageIndex].deactivate();

                this._activePageIndex = val;
                this.update();
            }
        }
    }

    get activePage() {
        if (this._activePageIndex >= 0)
            return this.controls[this._activePageIndex];
        else
            return null;
    }

    get headerVisible() {
        return this._headerVisible;
    }

    set headerVisible(val) {
        if (this._headerVisible != val) {
            this._headerVisible = val;
            if (val)
                this.paddingTop = this._headerHeight;
            else
                this.paddingTop = 0;
        }
    }

    get pageCount() {
        return this.controls.count;
    }

    get pages() {
        return this.controls;
    }

    get showCloseButton() {
        return this._showCloseButton;
    }

    set showCloseButton(val) {
        if (this._showCloseButton != val) {
            this._showCloseButton = val;
            this._formatAllHeader();
            this.updateRect(TRect.CreateByBounds(0, 0, this.width, this._headerHeight));
        }
    }
}

export class TCusotmGridRow extends TList {
    constructor(colCount) {
        super();
        this.onAdded = (cell) => {
            cell.onUpdate = () => {
                if (this.onUpdate != null)
                    this.onUpdate();
            }
        }

        this.initCol(colCount);
    }

    createNewCell() {
        return new TCustomGridCell();
    }

    initCol(colCount) {
        this.clear();
        let vCell;
        for (let i = 0; i < colCount; i++) {
            vCell = this.createNewCell();
            this.add(vCell);
        }
    }
}

export class TCustomGridCell extends TObject {
    constructor() {
        super();
        this._value = "";
        this.onUpdate = null;
    }

    setValue(val) {
        if (this._value != val) {
            this._value = val;
            if (this.onUpdate != null)
                this.onUpdate();
        }
    }

    paintTo(hclCanvas, rect) {
        hclCanvas.textRect(rect, rect.left + 2, rect.top + 4, this._value);
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this.setValue(val);
    }
}

class TGridOption extends TObject {
    constructor() {
        super();
        this.rowSelect = true;
    }
}

export class TCustomGrid extends TScrollPanel {
    constructor(rowCount = 2, colCount = 2) {
        super();
        this.state_.add(TControlState.Creating);
        this.canFocus = true;
        this.defaultRowHeight = 22;
        this.defaultColWidth = 30;
        this._colWidths = new Array;
        this.row_ = -1;
        this.col_ = -1;
        this.width_ = 200;
        this.height_ = 200;
        this.leftOffset_ = 0;
        this.topOffset_ = 0;
        this.fixRowCount_ = 0;
        this.FRowDispRange = null;
        this.FColDispRange = null;
        this.option = new TGridOption();
        this.rows = new TList();
        this.rows.onAdded = (row) => {
            row.onUpdate = () => { this.update(); }
            this.doContentResize_();
        }

        this.rows.onRemoved = (row) => {
            this.doContentResize_();
        }

        this.initRowCol(rowCount, colCount);
        this.state_.delete(TControlState.Creating);
    }

    _calcDisplayRow() {
        let vFirst = 0, vLast = this.rows.count - 1, vTop = 0;
        for (let i = 0; i < vLast; i++) {
            vTop += this.getRowHeight_(i);
            if (vTop > this.VScroll_.position) {
                vFirst = i;
                vTop -= this.getRowHeight_(i);
                break;
            }
        }

        for (let i = vFirst; i < vLast; i++) {
            vTop += this.getRowHeight_(i);
            if (vTop - this.VScroll_.position > this.height) {
                vLast = i;
                break;
            }
        }

        return {
            first: vFirst,
            last: vLast
        }
    }

    _calcDisplayCol() {
        let vFirst = 0, vLast = this._colWidths.length - 1, vLeft = 0;
        for (let i = 0; i < vLast; i++) {
            vLeft += this._colWidths[i];
            if (vLeft > this.HScroll_.position) {
                vFirst = i;
                vLeft -= this._colWidths[i];
                break;
            }
        }

        for (let i = vFirst; i < vLast; i++) {
            vLeft += this._colWidths[i];
            if (vLeft - this.HScroll_.position > this.width) {
                vLast = i;
                break;
            }
        }

        return {
            first: vFirst,
            last: vLast
        }
    }

    _calcDisplayRowAndCol() {
        this.FRowDispRange = this._calcDisplayRow();
        this.FColDispRange  = this._calcDisplayCol();

        this.topOffset_ = 0;
        this.leftOffset_ = 0;
        for (let i = 0; i < this.FRowDispRange.first; i++)
            this.topOffset_ += this.getRowHeight_(i);

        this.topOffset_ -= this.VScroll_.position;

        for (let i = 0; i < this.FColDispRange.first; i++)
            this.leftOffset_ += this._colWidths[i];

        this.leftOffset_ -= this.HScroll_.position;        
    }

    viewScroll_() {
        this._calcDisplayRowAndCol();
        super.viewScroll_();
    }

    calcContentSize_() {
        if (this.col_ > this._colWidths.length - 1)
            this.col_ = -1;

        if (this.row_ > this.rows.count - 1)
            this.row_ = -1;

        this.contentHeight_ = 0;
        for (let i = 0; i < this.rows.count; i++)
            this.contentHeight_ += this.getRowHeight_(i);

        this.contentWidth_ = 0;
        for (let i = 0; i < this._colWidths.length; i++)
            this.contentWidth_ += this._colWidths[i];
    }

    doContentResize_() {
        if (this._updateCount > 0)
            return;

        super.doContentResize_();
        this._calcDisplayRowAndCol();
        this.update();
    }

    endUpdate() {
        super.doContentResize_();
        this._calcDisplayRowAndCol();
        super.endUpdate();
    }

    getRowHeight_(r) {
        return this.defaultRowHeight;
    }

    getCellWidth_(r, c) {
        return this._colWidths[c];
    }

    doKeyDown_(e) {
        super.doKeyDown_(e);
        if (e.keyCode == TKey.Down) {
            if (this.row_ < this.rows.count - 1) {
                if ((this.fixRowCount_ > 0) && (this.row_ < this.fixRowCount_))
                    this.row = this.fixRowCount_;
                else
                    this.row = this.row_ + 1;
            } else if (this.rows.count > 0) {
                if ((this.fixRowCount_ > 0) && (this.rows.count > this.fixRowCount_))
                    this.row = this.fixRowCount_;
                else
                    this.row = 0;
            }
        } else if (e.keyCode == TKey.Up) {
            if (this.rows.count > 0) {
                if (this.row_ > 0) {
                    if (this.fixRowCount_ > 0) {
                        if (this.row_ > this.fixRowCount_)
                            this.row = this.row_ - 1;
                        else
                            this.row = this.rows.count - 1;
                    } else if (this.row_ > 0)
                        this.row = this.row_ - 1;
                } else
                    this.row = this.rows.count - 1;
            }
        }
    }

    doMouseDown_(e) {
        super.doMouseDown_(e);
        if (this.getControlAt(e.x, e.y, true) == null) {
            let vInfo = this.getCellAt(e.x, e.y);
            if (this.row_ != vInfo.row || this.col_ != vInfo.col) {
                this.row_ = vInfo.row;
                this.col_ = vInfo.col;
                this.update();
            }
        }
    }

    doRowPaint_(hclCanvas, rect, r) {
        if (this.onRowPaint != null)
            return this.onRowPaint(hclCanvas, rect, r);
        else
            return false;   
    }

    doCellPaint_(hclCanvas, rect, r, c) {
        if (this.onCellPaint != null) {
            hclCanvas.save();
            try {
                return this.onCellPaint(hclCanvas, rect, r, c);
            } finally {
                hclCanvas.restore();
            }
        } else
            return false;
    }

    doPaint_(hclCanvas) {
        if (this.rows.count == 0)
            return;

        let vLeft = 0, vTop = 0, vWidth, vHeight;
        hclCanvas.font.assign(THCCanvas.DefaultFont);
        hclCanvas.pen.width = hcl.theme.borderWidth;
        hclCanvas.pen.color = hcl.theme.borderColor;

        let vRect = new TRect();
        if (this.fixRowCount_) {
            vTop = 0;
            hclCanvas.brush.color = hcl.theme.backgroundDownColor;
            for (let r = 0; r < this.fixRowCount; r++) {
                vHeight = this.getRowHeight_(r);
                vLeft = this.leftOffset_;
                for (let c = this.FColDispRange.first; c <= this.FColDispRange.last; c++) {
                    vWidth = this.getCellWidth_(r, c);
                    if (vWidth > 0) {
                        vRect.resetBounds(vLeft, vTop, vWidth, vHeight);
                        hclCanvas.fillRect(vRect);
                        if (!this.doCellPaint_(hclCanvas, vRect, r, c))
                            this.rows[r][c].paintTo(hclCanvas, vRect);

                        vRect.left -= hcl.theme.borderWidth;
                        vRect.top -= hcl.theme.borderWidth;
                        hclCanvas.rectangleRect(vRect);
                        vLeft += vWidth;
                    }
                }
    
                vTop += vHeight;                
            }
        }

        
        if (this.HScroll_.visible && this.VScroll_.visible) {
            hclCanvas.brush.color = hcl.theme.backgroundStaticColor;
            hclCanvas.fillBounds(this.VScroll_.left, this.HScroll_.top, this.VScroll_.width, this.HScroll_.height);
        }

        hclCanvas.save();
        try {
            hclCanvas.clip(this.borderVisible ? hcl.theme.borderWidth : 0,
                vTop,
                this.VScroll_.visible ? this.width - this.VScroll_.width : this.width - hcl.theme.borderWidth,
                this.HScroll_.visible ? this.height - vTop - this.HScroll_.height : this.height - vTop - hcl.theme.borderWidth);

            vLeft = this.leftOffset_;
            vTop = this.topOffset_;
            for (let r = this.FRowDispRange.first; r <= this.FRowDispRange.last; r++) {
                vHeight = this.getRowHeight_(r);
                vLeft = this.leftOffset_;
                
                vRect.resetBounds(vLeft, vTop, this.width, vHeight);
                if (!this.doRowPaint_(hclCanvas, vRect, r)) {
                    hclCanvas.brush.color = hcl.theme.backgroundContentColor;
                    hclCanvas.fillRect(vRect);
                }

                for (let c = this.FColDispRange.first; c <= this.FColDispRange.last; c++) {
                    vWidth = this.getCellWidth_(r, c);
                    if (vWidth > 0) {
                        vRect.resetBounds(vLeft, vTop, vWidth, vHeight);
                        if (r == this.row_) {
                            if (this.option.rowSelect || c == this.col_) {
                                hclCanvas.brush.color = hcl.theme.backgroundSelectColor;
                                hclCanvas.fillRect(vRect);
                            }
                        }

                        if (!this.doCellPaint_(hclCanvas, vRect, r, c))
                            this.rows[r][c].paintTo(hclCanvas, vRect);

                        vRect.left -= hcl.theme.borderWidth;
                        vRect.top -= hcl.theme.borderWidth;
                        hclCanvas.rectangleRect(vRect);
                        vLeft += vWidth;
                    }
                }

                vTop += vHeight;
            }
        } finally {
            hclCanvas.restore();
        }

        super.doPaint_(hclCanvas);
    }

    doCreateNewRow_(colCount) {
        return new TCusotmGridRow(colCount)
    }

    initRowCol(rowCount, colCount) {
        this.rows.clear();
        let vRow;
        for (let i = 0; i < rowCount; i++) {
            vRow = this.doCreateNewRow_(colCount);
            this.rows.add(vRow);
        }

        this._colWidths = new Array(colCount);
        for (let i = 0; i < colCount; i++)
            this._colWidths[i] = this.defaultColWidth;

        this.doContentResize_();
    }

    setColWidth(c, w) {
        this._colWidths[c] = w;
        this.doContentResize_();
    }

    setRowCount(val) {
        if (this.rows.count != val) {
            if (this.rows.count > val) {
                this.beginUpdate();
                try {
                    while (this.rows.count > val)
                        this.rows.removeAt(this.rows.count - 1);
                } finally {
                    this.endUpdate();
                }
            } else {
                let vRow;
                this.beginUpdate();
                try {
                    while (this.rows.count < val) {
                        vRow = this.doCreateNewRow_(this.colCount);
                        this.rows.add(vRow);
                    }
                } finally {
                    this.endUpdate();
                }
            }

            //this.doContentResize_();
        }
    }

    setColCount(val) {
        if (this._colWidths.length != val) {
            if (this._colWidths.length > val) {
                while (this._colWidths.length > val) {
                    for (let i = 0; i < this.rows.count; i++)
                        this.rows[i].removeAt(this._colWidths.length - 1);

                    this._colWidths.length -= 1;
                }
            } else {
                let vCell;
                while (this._colWidths.length < val) {
                    for (let i = 0; i < this.rows.count; i++) {
                        vCell = this.rows[i].createNewCell();
                        this.rows[i].add(vCell);
                    }
                }
            }

            this.doContentResize_();
        }
    }

    getCellAt(x, y) {
        let vRect = new TRect(), vLeft, vTop = this.topOffset_, vHeight, vWidth;
        for (let r = this.FRowDispRange.first; r <= this.FRowDispRange.last; r++) {
            vHeight = this.getRowHeight_(r);
            vLeft = this.leftOffset_;
            for (let c = this.FColDispRange.first; c <= this.FColDispRange.last; c++) {
                vWidth = this.getCellWidth_(r, c);
                vRect.resetBounds(vLeft, vTop, vWidth, vHeight);
                if (vRect.pointInAt(x, y)) {
                    return {
                        row: r,
                        col: c
                    }
                }

                vLeft += vWidth;
            }

            vTop += vHeight;
        }

        return {
            row: -1,
            col: -1
        }
    }

    getCellRect(r, c) {
        let vTop = 0, vLeft = 0;
        for (let i = 0; i < r; i++)
            vTop += this.getRowHeight_(i);

        vTop -= this.VScroll_.position;

        for (let i = 0; i < c; i++)
            vLeft += this._colWidths[i];

        vLeft -= this.HScroll_.position;

        return TRect.CreateByBounds(vLeft, vTop, this._colWidths[c], this.getRowHeight_(r));
    }

    deleteRow(r, count = 1) {
        if (r < this.fixRowCount_)
            return;

        if (count < 1)
            return;

        let vRCount = this.rowCount, vCCount = this.colCount;
        count = Math.min(count, vRCount - r);
        while (r + count < vRCount) {
            for (let c = 0; c < vCCount; c++)
                this.rows[r][c].value = this.rows[r + count][c].value;

            r++;
        }

        this.rowCount = this.rowCount - count;
    }

    get contentHeight() {
        return this.contentHeight_;
    }

    get rowCount() {
        return this.rows.count;
    }

    set rowCount(val) {
        this.setRowCount(val)
    }

    get colCount() {
        return this._colWidths.length;
    }

    set colCount(val) {
        this.setColCount(val);
    }

    get fixRowCount() {
        return this.fixRowCount_;
    }

    set fixRowCount(val) {
        if (this.fixRowCount_ != val) {
            this.fixRowCount_ = val;
            this.update();
        }
    }

    get row() {
        return this.row_;
    }

    set row(val) {
        if (this.row_ != val) {
            if (val >= 0 && val < this.rows.count)
                this.row_ = val;
            else
                this.row_ = -1;

            this.update();
        }
    }

    get col() {
        return this.col_;
    }

    set col(val) {
        if (this.col_ != val) {
            if (val >= 0 && val < this._colWidths.length - 1)
                this.col_ = val;
            else
                this.col_ = -1;

            this.update();
        }
    }
}

export class TGrid extends TCustomGrid {
    constructor(rowCount, colCount) {
        super(rowCount, colCount);
        this.readOnly = false;
        this.FInnerEdit_ = new TEdit();
        this.FInnerEdit_.visible_ = false;
        this.FInnerEdit_._marginLeft = 0;
        this.FInnerEdit_._marginTop = 0;
        this.FInnerEdit_._marginRight = 0;
        this.FInnerEdit_._marginBottom = 0;
        this.FInnerEdit_._paddingLeft = 2;
        this.FInnerEdit_._paddingTop = 0;
        this.FInnerEdit_._paddingRight = 2;
        this.FInnerEdit_._paddingBottom = 0;
        this.FInnerEdit_.onKeyDown = (e) => {
            if (e.keyCode == TKey.Return)
                this.doSetInnerEdit_();
            else if (e.keyCode == TKey.Escape)
                this.doSetInnerEdit_(false);
        }

        this.FInnerEdit_.onKillFocus = () => {
            this.doSetInnerEdit_();
        }

        this.FEditRow = -1;
        this.FEditCol = -1;
        this.addControl(this.FInnerEdit_);
    }

    doSetInnerEdit_(accept = true) {
        if (this.FEditRow >= 0 && this.FEditRow < this.rowCount) {
            if (accept)
                this.rows[this.FEditRow][this.FEditCol].value = this.FInnerEdit_.text;
            else  // 取消时恢复原值，便于下面visible为false时触发killFocus时再次触发此事件accept为true时不赋edit的值
                this.FInnerEdit_.text = this.rows[this.FEditRow][this.FEditCol].value;
        }
        this.FInnerEdit_.visible = false;
    }

    doMouseDown_(e) {
        if (this.FInnerEdit_.visible_) {
            if (this.FInnerEdit_.bounds().pointInAt(e.x, e.y)) {
                super.doMouseDown_(e);
                return;
            }
        }

        let vOldRow = this.row_, vOldCol = this.col_;
        super.doMouseDown_(e);
        if (!this.readOnly) {
            if (this.row_ > this.fixRowCount_ - 1 && this.col_ >= 0) {
                if (vOldRow == this.row_ && vOldCol == this.col_) {  // 本次点在同一个单元格
                    this.FInnerEdit_.text = this.rows[this.row_][this.col_].value;
                    let vRect = this.getCellRect(this.row_, this.col_);
                    vRect.left -= hcl.theme.borderWidth;
                    vRect.top -= hcl.theme.borderWidth;
                    this.FInnerEdit_.left = vRect.left;
                    this.FInnerEdit_.top = vRect.top;
                    this.FInnerEdit_.width_ = vRect.width;
                    this.FInnerEdit_.height_ = vRect.height;
                    this.FInnerEdit_.visible = true;

                    this.FEditRow = vOldRow;
                    this.FEditCol = vOldCol;

                    let vMouseArgs = new TMouseEventArgs();
                    vMouseArgs.assign(e);
                    vMouseArgs.x -= this.FInnerEdit_.left;
                    vMouseArgs.y -= this.FInnerEdit_.top;
                    this.FInnerEdit_.mouseDown(vMouseArgs);
                }
            }
        }
    }
}

export class TTreeNode extends TObject {
    constructor(text = "") {
        super();
        this.text_ = text;
        this.level = 0;
        this._expand = false;
        this.parent = null;
        this.object = null;
        this.onChange = null;
        this.onPaint = null;
        this.childs = new TList();
        this.childs.onAdded = (node) => {
            node.parent = this;
            node.level = this.level + 1;
            node.onChange = (node) => {
                this.doChange_(node);
            }

            node.onPaint = (hclCanvas, node, left, top) => {
                this.doPaint_(hclCanvas, node, left, top);
            }

            this.doChange_()
        }

        this.childs.onRemoved = (node) => {
            this.doChange_(node);
        }
    }

    doChange_(node) {
        if (this.onChange != null)
            this.onChange(node);
    }

    doPaint_(hclCanvas, node, left, top) {
        if (this.onPaint != null)
            this.onPaint(hclCanvas, node, left, top);
    }

    setText(val) {
        if (this.text_ != val) {
            this.text_ = val;
            this.doChange_();
        }
    }

    getNodeAt(x, y, atop) {
        if (y > atop && y <= atop + hcl.theme.itemHeight)
            return {
                node: this,
                top: atop + hcl.theme.itemHeight
            }

        atop += hcl.theme.itemHeight;

        if (this._expand) {
            let vInfo;
            for (let i = 0, vCount = this.childCount; i < vCount; i++) {
                vInfo = this.childs[i].getNodeAt(x + hcl.theme.iconWidth, y, atop);
                if (vInfo.node != null)
                    return vInfo;

                atop = vInfo.top;
            }
        }

        return {
            node: null,
            top: atop
        }
    }

    paintTo(hclCanvas, left, top) {
        this.doPaint_(hclCanvas, this, left, top);
        top += hcl.theme.itemHeight;

        if (this._expand) {
            for (let i = 0, vCount = this.childCount; i < vCount; i++)
                top = this.childs[i].paintTo(hclCanvas, left + hcl.theme.iconWidth, top);
        }
        return top;
    }

    addNode(text = "", object = null) {
        let vNode = new TTreeNode(text);
        vNode.object = object;
        this.childs.add(vNode);
        return vNode;
    }

    getHeight() {
        let vH = hcl.theme.itemHeight;
        if (this._expand) {
            for (let i = 0, vCount = this.childCount; i < vCount; i++)
                vH += this.childs[i].getHeight();
        }
        return vH;
    }

    deleteNode(node) {
        if (node == null)
            return;

        this.childs.remove(node);
    }

    get childCount() {
        return this.childs.count;
    }

    get text() {
        return this.text_;
    }

    set text(val) {
        this.setText(val);
    }

    get expand() {
        return this._expand;
    }

    set expand(val) {
        if (this.childs.count > 0) {
            if (this._expand != val) {
                this._expand = val;
                this.doChange_();
            }
        }
    }
}

export class TTreeView extends TScrollPanel {
    constructor() {
        super();
        this.state_.add(TControlState.Creating);
        this.canFocus = true;
        this.selectNode = null;
        this.nodes = new TList();
        this.nodes.onAdded = (node) => {
            node.parent = null;
            node.level = 0;
            node.onPaint = (hclCanvas, node, left, top) => {
                this._doNodePaint(hclCanvas, node, left, top);
            }

            node.onChange = (node) => {
                this._doNodeChange(node);
            }

            this.doContentResize_();
        }

        this.nodes.onRemoved = (node) => {
            this.doContentResize_();
        }

        this.width = 200;
        this.height = 200;
        this.onNodePaint = null;
        this.onCollaps = null;
        this.onExpand = null;
        this.onSelectChanged = null;
        this.state_.delete(TControlState.Creating);
    }

    _doNodePaint(hclCanvas, node, left, top) {
        if (top + hcl.theme.itemHeight < 0)
            return;

        if (top > this.height)
            return;

        if (node === this.selectNode) {
            hclCanvas.brush.color = hcl.theme.backgroundSelectColor;
            //hclCanvas.fillBounds(left + theme.iconWidth, top, hclCanvas.textWidth(node.text), theme.itemHeight);
            hclCanvas.fillBounds(0, top, this.width, hcl.theme.itemHeight);
        }

        if (node.childCount > 0) {
            if (node._expand)
                hclCanvas.drawImage(left + 2, top + 2, hcl.theme.expandImage);
            else
                hclCanvas.drawImage(left + 2, top + 2, hcl.theme.foldImage);
        }

        if (this.onNodePaint != null) {
            if (this.onNodePaint(hclCanvas, node, left, top))  // 返回true则不进行后面默认的文本绘制
                return;
        }

        hclCanvas.textOut(left + hcl.theme.iconWidth, top + 3, node.text);
    }

    _doNodeChange(node) {
        this.doContentResize_();
    }

    calcContentSize_() {
        super.calcContentSize_();
        for (let i = 0, vCount = this.nodes.count; i < vCount; i++)
            this.contentHeight_ += this.nodes[i].getHeight();
    }

    doContentResize_() {
        super.doContentResize_();
        this.update();
    }

    doPaint_(hclCanvas) {
        let vLeft = 0, vTop = 0;
        if (this.borderVisible) {
            vLeft = hcl.theme.borderWidth;
            vTop = hcl.theme.borderWidth;
        }

        vTop -= this.VScroll_.position;

        hclCanvas.font.assign(THCCanvas.DefaultFont);
        for (let i = 0, vCount = this.nodes.count; i < vCount; i++)
            vTop = this.nodes[i].paintTo(hclCanvas, vLeft, vTop);

        super.doPaint_(hclCanvas);
    }

    doMouseDown_(e) {
        let vNode = this.getNodeAt(e.x, e.y);
        if (this.selectNode !== vNode) {
            this.selectNode = vNode;
            if (this.onSelectChanged)
                this.onSelectChanged();

            this.update();
        }

        super.doMouseDown_(e);
    }

    doMouseUp_(e) {
        let vNode = this.getNodeAt(e.x, e.y);
        if (vNode != null && vNode === this.selectNode) {
            if (e.x > vNode.level * hcl.theme.iconWidth && e.x < (vNode.level + 1) * hcl.theme.iconWidth)
                this.expandSwitch(vNode);
        }

        super.doMouseUp_(e);
    }

    doDblClick_(e) {
        if (this.selectNode != null)
            this.expandSwitch(this.selectNode);

        super.doDblClick_(e);
    }

    expandSwitch(node) {
        if (node.expand && this.onCollaps != null)
            this.onCollaps(node);
        else if (!node.expand && this.onExpand != null)
            this.onExpand(node);

        node.expand = !node.expand;
    }

    getNodeAt(x, y) {
        let vTop = this.borderVisible ? hcl.theme.borderWidth : 0;
        vTop -= this.VScroll_.position;
        let vInfo = null;
        for (let i = 0, vCount = this.nodes.count; i < vCount; i++) {
            vInfo = this.nodes[i].getNodeAt(x, y, vTop);
            if (vInfo.node != null)
                return vInfo.node;

            vTop = vInfo.top;
        }

        return null;
    }

    addNode(text = "", object = null) {
        let vNode = new TTreeNode(text);
        vNode.object = object;
        this.nodes.add(vNode);
        return vNode;
    }

    deleteNode(node) {
        if (node == null)
            return;

        if (node.parent != null) {
            node.parent.deleteNode(node);
        } else
            this.nodes.remove(node);

        this.selectNode = null;
    }
}