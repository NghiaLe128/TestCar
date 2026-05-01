class GaugeController {
	constructor() {
		this.speedNeedle = document.getElementById('speedNeedle');
		this.powerNeedle = document.getElementById('powerNeedle');
		this.speedValue = document.getElementById('speedValue');
		this.powerValue = document.getElementById('powerValue');

		this.speedGauge = document.querySelector('.speed-gauge');
		this.powerGauge = document.querySelector('.power-gauge');

		this.maxSpeed = Number(this.speedGauge?.dataset.max ?? 160);
		this.maxPower = Number(this.powerGauge?.dataset.max ?? 400);

		this.init();
	}

	init() {
		this.createScale(this.speedGauge);
		this.createScale(this.powerGauge);
		this.updateGauge(this.speedNeedle, 6, this.maxSpeed);
		this.updateGauge(this.powerNeedle, 320, this.maxPower);
	}

	createScale(gaugeElement) {
		if (!gaugeElement) {
			return;
		}

		const maxValue = Number(gaugeElement.dataset.max ?? 100);
		const majorStep = Number(gaugeElement.dataset.step ?? 20);
		const minorStep = Number(gaugeElement.dataset.minor ?? majorStep / 2);
		const isRpmGauge = gaugeElement.classList.contains('speed-gauge');
		const ticksContainer = gaugeElement.querySelector('.gauge-ticks');
		const numbersContainer = gaugeElement.querySelector('.gauge-numbers');
		const face = gaugeElement.querySelector('.gauge-face');

		if (!ticksContainer || !numbersContainer || !face) {
			return;
		}

		ticksContainer.textContent = '';
		numbersContainer.textContent = '';

		const gaugeSize = face.clientWidth;
		const tickRadius = gaugeSize * 0.42;
		const numberInsetFromTicks = isRpmGauge ? 30 : (maxValue >= 500 ? 40 : 34);
		const mainNumberRadius = tickRadius - numberInsetFromTicks;
		const redlineStart = maxValue * 0.875;
		const minorCount = Math.round(maxValue / minorStep);
		const majorCount = Math.round(maxValue / majorStep);

		for (let index = 0; index <= minorCount; index += 1) {
			const value = index * minorStep;
			const ratio = value / maxValue;
			const angle = -120 + ratio * 240;
			const isMajor = Math.abs(value / majorStep - Math.round(value / majorStep)) < 0.0001;
			const tick = document.createElement('div');
			tick.className = `tick${isMajor ? ' major' : ''}`;
			if (isRpmGauge && value >= redlineStart) {
				tick.classList.add('danger');
			}
			tick.style.setProperty('--angle', `${angle}deg`);
			tick.style.setProperty('--tick-radius', `${tickRadius}px`);
			ticksContainer.appendChild(tick);
		}

		for (let index = 0; index <= majorCount; index += 1) {
			const value = index * majorStep;
			const ratio = value / maxValue;
			const angle = -120 + ratio * 240;
			const number = document.createElement('div');
			number.className = 'number';
			number.style.setProperty('--angle', `${angle}deg`);
			number.style.setProperty('--number-radius', `${mainNumberRadius}px`);
			number.textContent = isRpmGauge ? String(index) : String(Math.round(value));
			numbersContainer.appendChild(number);
		}
	}

	updateGauge(needle, value, maxValue) {
		const percentage = value / maxValue;
		const rotation = -120 + percentage * 240;
		needle.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;

		if (needle === this.speedNeedle) {
			this.speedValue.textContent = Math.round(value * 1000);
		} else {
			this.powerValue.textContent = Math.round(value);
		}
	}

}

document.addEventListener('DOMContentLoaded', () => {
	new GaugeController();
});