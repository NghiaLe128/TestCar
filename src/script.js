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
		this.updateGauge(this.speedNeedle, 62, this.maxSpeed);
		this.updateGauge(this.powerNeedle, 320, this.maxPower);
	}

	createScale(gaugeElement) {
		if (!gaugeElement) {
			return;
		}

		const maxValue = Number(gaugeElement.dataset.max ?? 100);
		const majorStep = Number(gaugeElement.dataset.step ?? 20);
		const minorStep = Number(gaugeElement.dataset.minor ?? majorStep / 2);
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
		const numberInsetFromTicks = maxValue >= 500 ? 40 : 34;
		const mainNumberRadius = tickRadius - numberInsetFromTicks;

		for (let value = 0; value <= maxValue; value += minorStep) {
			const ratio = value / maxValue;
			const angle = -120 + ratio * 240;
			const isMajor = value % majorStep === 0;
			const tick = document.createElement('div');
			tick.className = `tick${isMajor ? ' major' : ''}`;
			tick.style.setProperty('--angle', `${angle}deg`);
			tick.style.setProperty('--tick-radius', `${tickRadius}px`);
			ticksContainer.appendChild(tick);
		}

		for (let value = 0; value <= maxValue; value += majorStep) {
			const ratio = value / maxValue;
			const angle = -120 + ratio * 240;
			const number = document.createElement('div');
			number.className = 'number';
			number.style.setProperty('--angle', `${angle}deg`);
			number.style.setProperty('--number-radius', `${mainNumberRadius}px`);
			number.textContent = String(value);
			numbersContainer.appendChild(number);
		}
	}

	updateGauge(needle, value, maxValue) {
		const percentage = value / maxValue;
		const rotation = -120 + percentage * 240;
		needle.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;

		if (needle === this.speedNeedle) {
			this.speedValue.textContent = Math.round(value);
		} else {
			this.powerValue.textContent = Math.round(value);
		}
	}

}

document.addEventListener('DOMContentLoaded', () => {
	new GaugeController();
});