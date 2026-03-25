// ViewCube.js
class ViewCube {
    constructor(renderer, mainCamera, mainControls, domElement) {
        this.renderer = renderer;
        this.mainCamera = mainCamera;
        this.controls = mainControls;
        this.domElement = domElement;

        this.scene = new THREE.Scene();
        this.camera = null;
        this.mesh = null;
        this.size = 100; // 方块视窗大小
        this.margin = 20; // 边距

        this.lastHoverIndex = -1;
        this.materials = [];
        
        this.init();
        this.bindEvents();
    }

    init() {
        const aspect = 1;
        const frustumSize = 2;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2,
            0.1, 100
        );
        this.camera.position.set(0, 0, 2);
        this.camera.lookAt(0, 0, 0);

        // 创建6个面的材质
        const labels = ['右', '左', '上', '下', '前', '后'];
        this.materials = labels.map(text => this.createTexture(text));

        const geo = new THREE.BoxGeometry(1, 1, 1);
        this.mesh = new THREE.Mesh(geo, this.materials);
        this.scene.add(this.mesh);
    }

    createTexture(text, bgColor = '#444444', hover = false) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, size, size);
        const r = 20, p = 6, w = size - 2*p, h = size - 2*p;
        
        ctx.fillStyle = hover ? '#666666' : bgColor;
        ctx.beginPath();
        // 兼容性处理 roundRect
        if (ctx.roundRect) {
            ctx.roundRect(p, p, w, h, r);
        } else {
            ctx.rect(p, p, w, h); 
        }
        ctx.fill();
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#666666';
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size/2, size/2);
        
        return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) });
    }

    render() {
        // 让 ViewCube 的相机旋转跟随主相机
        const direction = new THREE.Vector3().copy(this.mainCamera.position).sub(this.controls.target).normalize();
        this.camera.position.copy(direction).multiplyScalar(2);
        this.camera.lookAt(0, 0, 0);
        this.camera.up.copy(this.mainCamera.up);
        this.camera.updateMatrixWorld();

        // 计算视口位置（右上角）
        const rendererSize = new THREE.Vector2();
        this.renderer.getSize(rendererSize);
        const viewportLeft = rendererSize.width - this.size - this.margin;
        const viewportBottom = rendererSize.height - this.margin - this.size;

        // 渲染 ViewCube
        this.renderer.clearDepth(); // 清除深度缓冲区，让其显示在最上层
        this.renderer.setScissorTest(true);
        this.renderer.setViewport(viewportLeft, viewportBottom, this.size, this.size);
        this.renderer.setScissor(viewportLeft, viewportBottom, this.size, this.size);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setScissorTest(false);
    }

    bindEvents() {
        // 绑定到 canvas 上，而不是 window
        this.domElement.addEventListener('pointerdown', (e) => this.onClick(e));
        this.domElement.addEventListener('mousemove', (e) => this.onHover(e));
    }

    getIntersection(event) {
        const rect = this.domElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const rendererSize = new THREE.Vector2();
        this.renderer.getSize(rendererSize);
        
        const startX = rendererSize.width - this.size - this.margin;
        const startY = this.margin; // 这里的Y是相对于顶部的

        // 检查鼠标是否在 ViewCube 区域内
        if (x < startX || x > startX + this.size || y < startY || y > startY + this.size) {
            return null;
        }

        // 归一化坐标转换
        const mouse = new THREE.Vector2();
        mouse.x = ((x - startX) / this.size) * 2 - 1;
        mouse.y = -((y - startY) / this.size) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObject(this.mesh);

        return intersects.length > 0 ? intersects[0] : null;
    }

    onHover(event) {
        const result = this.getIntersection(event);
        let hoverIndex = -1;
        
        if (result) {
            hoverIndex = result.face.materialIndex;
            document.body.style.cursor = 'pointer';
        } else {
            // 注意：这里可能会覆盖主场景的鼠标样式，实际使用中可能需要更复杂的判断
             // document.body.style.cursor = 'default'; 
        }

        if (hoverIndex !== this.lastHoverIndex) {
            const labels = ['右', '左', '上', '下', '前', '后'];
            
            // 恢复旧的
            if (this.lastHoverIndex !== -1) {
                this.mesh.material[this.lastHoverIndex] = this.createTexture(labels[this.lastHoverIndex], '#444444', false);
            }
            // 高亮新的
            if (hoverIndex !== -1) {
                this.mesh.material[hoverIndex] = this.createTexture(labels[hoverIndex], '#444444', true);
            }
            this.lastHoverIndex = hoverIndex;
        }
    }

    onClick(event) {
        const intersection = this.getIntersection(event);
        if (intersection) {
            this.alignView(intersection.face.materialIndex);
        }
    }

    alignView(faceIndex) {
        const dist = this.mainCamera.position.distanceTo(this.controls.target);
        const targetPos = new THREE.Vector3().copy(this.controls.target);

        // 0:右, 1:左, 2:上, 3:下, 4:前, 5:后
        switch(faceIndex) {
            case 0: targetPos.x += dist; break; 
            case 1: targetPos.x -= dist; break; 
            case 2: targetPos.y += dist; break; 
            case 3: targetPos.y -= dist; break; 
            case 4: targetPos.z += dist; break; 
            case 5: targetPos.z -= dist; break; 
        }

        // 动画过渡可以在这里加，目前直接设置
        this.mainCamera.position.copy(targetPos);
        
        // 处理 Up 向量，防止 gimbal lock
        if (faceIndex === 2 || faceIndex === 3) {
            this.mainCamera.up.set(0, 0, -1); // 俯视/仰视时的 Up 方向
        } else {
            this.mainCamera.up.set(0, 1, 0);
        }
        
        this.mainCamera.lookAt(this.controls.target);
        this.controls.update();
    }
}
