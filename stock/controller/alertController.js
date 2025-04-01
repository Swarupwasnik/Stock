import Alert from '../models/Alert.js';

export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id });
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAlert = async (req, res) => {
  try {
    const { symbol, targetPrice, condition } = req.body;
    
    const newAlert = new Alert({
      user: req.user.id,
      symbol,
      targetPrice,
      condition
    });

    const savedAlert = await newAlert.save();
    res.status(201).json(savedAlert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.remove();
    res.json({ message: 'Alert removed' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};